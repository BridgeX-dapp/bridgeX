# BridgeX

BridgeX is a cross-chain bridge protocol and relayer system that connects EVM
networks with Casper. It enables users to move assets between chains by locking
canonical tokens on a source chain and minting wrapped tokens on the destination
chain (or burning wrapped tokens to unlock canonical tokens).

This repository contains smart contracts (EVM + Casper), a TypeScript relayer,
and supporting backend services for realtime transaction updates and token
registry management.

## What BridgeX Does (Simple Overview)

- **Lock canonical assets** on the source chain.
- **Emit a bridge event** that the relayer can read.
- **Mint wrapped assets** on the destination chain (or unlock canonical assets).
- **Track status** so users can see progress and final results.

In short: BridgeX is the middleware that turns a source-chain event into a
destination-chain transaction.

## Trust Model (MVP)

BridgeX currently operates as a **single relayer** system for MVP speed and
hackathon delivery. This is a common pattern in early-stage bridges and makes
the flow easy to ship, test, and iterate.

We explicitly plan to evolve this to a **multi-validator system** with
threshold signatures and on-chain verification (see Roadmap).

## High-Level Architecture

```
Source Chain                 BridgeX Relayer                  Destination Chain
-------------               -----------------                 ------------------
lock/burn call  --->  Listener -> Normalizer -> Persist  --->  mint/unlock call
event emitted            eventId -> Job Queue -> Executor      tx confirmed
```

### Core Components

- **Chain adapters (EVM, Casper)**
  - Providers, signers, contract helpers
  - Event listeners and normalizers
- **Executors**
  - Chain-agnostic workers that perform destination actions
- **Persistence**
  - Transaction state, token registry, chain registry
- **Realtime streaming**
  - WebSocket updates for frontend UIs

### Event and Transaction Flow

1) Source chain emits a bridge event (lock or burn).
2) Listener normalizes raw event data into a shared format.
3) A chain-agnostic eventId is generated and persisted.
4) A job is enqueued for execution on the destination chain.
5) Executor submits the destination transaction (mint/unlock).
6) Confirmation poller marks the transaction as EXECUTED only after
   on-chain confirmation.

## Supported Chains (Current MVP)

- EVM networks:
  - Base Sepolia
  - Arbitrum Sepolia
  - Polygon Amoy
- Casper (testnet)

## Token Registry and Mapping

BridgeX uses an internal token registry to resolve source tokens to destination
tokens. This enables the relayer to map:

- **Canonical -> Wrapped**
- **Wrapped -> Canonical**

Token pairs are stored in the database and can be managed via the catalog API.

## Casper vs EVM Differences

BridgeX abstracts chain differences through a set of normalizers and helpers:

- **EVM events** rely on logs + logIndex for ordering and identity.
- **Casper events** rely on event_id + deploy hash.
- **Recipient handling** is standardized to 32-byte values in the bridge
  flow to avoid chain-specific address formats.

## Current Status Model

Transactions follow this lifecycle:

- `LOCKED` / `BURNED` (source chain event observed)
- `EXECUTING` (destination tx submitted)
- `EXECUTED` (confirmed on destination)
- `FAILED` (confirmed failure)

This keeps state precise and prevents premature "success" reporting.

## Roadmap to Decentralization

BridgeX is designed to evolve without re-architecting the whole system.
Below is a practical path to decentralization:

### Phase 1: Multi-Relayer Quorum (M-of-N)
- Multiple independent relayers sign each event.
- Destination calls require quorum signatures.
- Removes single-relayer control.

### Phase 2: Validator Set + Slashing
- Validators stake collateral.
- On-chain penalties for invalid or conflicting signatures.
- Adds economic security.

### Phase 3: On-Chain Proof Verification
- Light-client or proof-based verification of source chain events.
- Reduced reliance on off-chain signatures.

### Phase 4: Decentralized Governance
- On-chain governance for parameters, validator sets, and upgrades.
- Transparent, community-driven control.

## Repository Layout (Relevant for Relayer)

```
relayer/
  src/api
    chains/evm        EVM chain adapters + helpers
    chains/casper     Casper chain adapters + helpers
    executors         Job handlers
    realtime          WebSocket streaming
    lib/utils         Shared utilities
```

Contracts live in:

```
contracts/
  evm/
  casper/
```

## Why BridgeX Is Different

- **Cross-chain by design**: Casper + EVM from day one.
- **Consistent event normalization**: shared eventId format across chains.
- **Live UX**: real-time transaction stream for user-facing apps.
- **Built to decentralize**: architecture already supports validator expansion.

## Contact / Notes

BridgeX is a fast-moving MVP project. Expect rapid iteration and improvements.
If you are reviewing for a hackathon or early-stage evaluation, focus on the
clear end-to-end flow and the realistic decentralization roadmap.
