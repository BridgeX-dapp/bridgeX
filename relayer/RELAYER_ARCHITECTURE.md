# BridgeX Relayer Architecture

This document describes the current and intended architecture of the BridgeX cross-chain relayer service. It focuses on responsibilities, data flow, and correctness guarantees without changing implementation details.

## Goals

- Provide a clear end-to-end picture of how events become execution actions.
- Keep chain-specific logic isolated from orchestration logic.
- Ensure idempotent, replay-safe processing across restarts and reorgs.

## High-Level Overview

The relayer consists of three main layers:

1) Chain-specific ingestion (EVM, Casper)
2) Shared persistence + queueing
3) Executors (chain-agnostic orchestration that dispatches chain-specific actions)

ASCII overview:

[ EVM Listener ]      [ Casper Listener ]
       |                      |
       v                      v
[ Normalize + Validate + Persist + Enqueue ]
                      |
                      v
               [ Job Queue ]
                      |
                      v
               [ Executors ]
          (select action by job type)
                      |
                      v
        [ Chain-specific contracts/signers ]

## Current Structure (as implemented)

- Chain-specific modules:
  - `src/api/chains/evm/*`
  - `src/api/chains/casper/*`
  - Each chain has its own config, provider, signer, listener, and helper utilities.

- Shared / cross-chain:
  - Prisma `Transaction`, `NetworkStatus`
  - BullMQ queues and job types
  - Executors in `src/api/executors/*`

## End-to-End Data Flow

### 1) Event Ingestion

- EVM listener subscribes to `LockedCanonical` and other bridge events.
- Casper listener subscribes to contract-events stream for `LockedCanonical`.
- Backfill modules can scan historical ranges on each chain.

### 2) Normalize and Validate

Each listener/backfill normalizes chain-specific payloads into a common shape:

- sourceChain
- eventName
- txHash, logIndex (or event_id for Casper)
- token, sender, recipient
- amount, feeAmount, netAmount
- destChainId, destAddress

Validation includes:
- event type is supported
- token config is valid
- minimal schema checks before persistence

### 3) Persist with Replay Safety

- Compute deterministic `eventId` from event fields.
- Upsert into `Transaction` table (idempotent write).
- Track last processed height/block in `NetworkStatus`.

This gives:
- Idempotency across replays
- Safe recovery after restarts
- Reorg-aware rewind window (EVM backfill uses reorg buffer)

### 4) Enqueue Job

- Add a BullMQ job using `jobId = eventId` to guarantee idempotency.
- Job payload references the persisted event by `eventId`.

### 5) Execute

- Executor pulls job, loads `Transaction` by `eventId`.
- Executor decides which action to run based on job type (or eventName).
- Executor calls chain-specific contract helpers with chain-specific signer.
- On success, update transaction status and store destination tx data.

### 6) Finalization (optional)

- Optionally confirm destination transaction finality before marking `FINALIZED`.

## Responsibility Boundaries

### Chain-Specific Modules (EVM / Casper)

Own:
- Chain configuration, providers, signers
- Event listeners / backfill logic
- Contract-specific data parsing and normalization
- Chain-specific transaction submission helpers

Do NOT:
- Decide cross-chain orchestration logic
- Directly manage job types for other chains
- Mutate cross-chain state outside of persistence and enqueue

### Executors (Chain-Agnostic Orchestration)

Own:
- Job handling and routing by job type
- Fetching normalized transactions from DB
- Deciding which chain action to run
- Status transitions and retry semantics

Do NOT:
- Parse chain-specific events
- Directly couple to network listeners

### Shared Utilities

Own:
- `generateEventId` logic
- Queue definitions
- Retry/backoff policies
- Prisma schema + DB access

## Flow Diagrams

### A) Live Event Flow

[EVM/Casper Listener]
    -> normalize
    -> validate
    -> persist (Transaction upsert)
    -> enqueue job (jobId = eventId)
    -> executor loads Transaction
    -> execute destination action
    -> update status

### B) Backfill Flow

[Backfill Range]
    -> query historical events
    -> normalize
    -> persist (idempotent)
    -> enqueue job
    -> advance NetworkStatus (after success)

## Execution Decision Model

Executors should map jobs to actions using a small, explicit dispatch table.

Example (conceptual):

- PROCESS_LOCKED_CANONICAL
  - if sourceChain = EVM -> mint or unlock on Casper
  - if sourceChain = CASPER -> mint or unlock on EVM

This keeps orchestration centralized while chain actions remain isolated.

## Signers and Contract Helpers

Rule: chain-specific contract calls are always created via chain-specific helpers.

- EVM helpers use EVM signer/provider and EVM ABI
- Casper helpers use Casper signer and Casper stored contract calls

This prevents cross-chain logic from leaking into orchestration.

## Idempotency and Replay Protection

- Deterministic `eventId` for each event
- `Transaction.eventId` is unique
- Job uses `jobId = eventId`
- `processed_events` on-chain for relayer-only flows
- Backfill uses reorg buffer for EVM

## Clear Separation of Concerns

Do not mix:
- Listener code with execution logic
- Contract calls with event parsing
- Chain-specific data structures with global orchestration

## Open Questions / Clarifications

Please confirm the intended mapping rules for:
- Which event types should be processed in phase 1
- The exact job types and naming for cross-chain actions
- Whether Casper listener should persist and enqueue now or remain read-only

---

## Future: Decentralized Relayer Architecture (Multi-Sig / Validators)

This section outlines a high-level extension path to decentralize execution using
multi-signature relayers (2-of-3, 3-of-5) or a validator set. The goal is to
keep the existing event ingestion flow but replace single-signer execution with
threshold authorization.

### Conceptual Flow

[Listeners + Normalization]
    -> [Shared Event Store]
    -> [Validator/Relayer Network Signs Event]
    -> [Threshold Aggregator]
    -> [Execute On Destination Chain]

Key idea: event ingestion remains centralized or replicated, but execution
requires a quorum of signatures.

### Building Blocks

- **Event canonicalization**: deterministic eventId as the signing payload.
- **Signature collection**: validators sign eventId (or hash of event payload).
- **Threshold validation**: aggregate signatures once quorum is met.
- **Execution adapter**: submit aggregated proof to destination chain.

### Multi-Signature Relayer (2-of-3 / 3-of-5)

Option A: Off-chain multisig + on-chain verification
- Each relayer signs eventId.
- A relayer service aggregates signatures and submits a single transaction.
- Destination chain contract verifies M-of-N signatures.

Option B: On-chain multisig contract
- Relayers submit signatures to a multisig contract.
- Multisig executes the bridge call once threshold is met.

### Validator-Based Model

- Maintain a validator registry on both chains.
- Each validator signs events; quorum required for execution.
- Slashing / reputation is optional but recommended for production safety.

### Extendability Plan (Minimal Changes)

1) Keep listeners, persistence, and eventId generation unchanged.
2) Replace single-signer executor with:
   - signature collector
   - threshold aggregator
   - execution adapter
3) Add on-chain verification logic:
   - either in BridgeCore or in a dedicated verifier contract.

### Data Flow Differences

Current:
Event -> Persist -> Job -> Single signer executes

Future:
Event -> Persist -> Job -> Collect signatures -> Threshold verify -> Execute

This preserves most of the current architecture while enabling decentralization.

If you want, I can add a section mapping this document directly onto the current file layout and entrypoints.
