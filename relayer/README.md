# BridgeX Relayer

BridgeX Relayer is a **TypeScript/Node.js service** that powers the on-chain “glue” for the BridgeX cross-chain bridge.

It:
- **Listens** to BridgeCore events on supported chains (currently EVM + Casper)
- **Normalizes** and **persists** bridge events to Postgres (via Prisma)
- **Enqueues** idempotent background jobs (BullMQ/Redis)
- **Executes** the destination-chain action (mint/unlock) in a worker (execution logic is being built out)

## How It Works (High Level)

1. **Source chain emits an event** (e.g. `LockedCanonical` on EVM BridgeCore)
2. Relayer **consumes the event** (WebSocket preferred, HTTP fallback)
3. Event is **normalized** into a common shape and **stored** (idempotently) in `Transaction`
4. Relayer **enqueues a job** using a deterministic `eventId`
5. A BullMQ **worker processes the job** and performs the destination action (WIP)

## Current Status

- EVM `LockedCanonical`:
  - Live listener: implemented
  - Backfill/catch-up: implemented
  - DB persistence + job enqueue: implemented
  - Destination execution: placeholder (marks DB row as `EXECUTED`)
- Casper:
  - Contract-events WebSocket listener: implemented
  - Persistence + enqueue: planned

## Tech Stack

- **API/runtime:** Express, Socket.IO
- **EVM:** `ethers`
- **Casper:** `ws` + CSPR.cloud contract-events stream
- **Queue:** BullMQ + Redis
- **DB:** Postgres + Prisma

## Project Layout

- `src/api/index.ts` — server bootstrap (starts listeners + worker)
- `src/api/chains/evm/` — EVM providers, contract listener, backfill, persistence
- `src/api/chains/casper/` — Casper event stream listener + normalizers
- `src/api/executors/` — BullMQ worker handlers (bridge execution)
- `src/api/lib/utils/jobs/` — BullMQ queue helpers
- `prisma/schema.prisma` — DB schema (`Transaction`, `NetworkStatus`, etc.)

## Getting Started

### Prerequisites

- Node.js (recommended: 18+)
- Postgres database
- Redis

### Install

This repo includes a `pnpm-lock.yaml`, but npm/yarn also work.

```bash
pnpm install
# or: npm install
```

### Configure Environment

Create a `.env` (do not commit secrets). Prisma uses `DATABASE_URL` and `DIRECT_URL`.

Minimum variables you’ll typically need:

```bash
# --- Database (Prisma) ---
DATABASE_URL=postgresql://USER:PASS@HOST:5432/bridgex
DIRECT_URL=postgresql://USER:PASS@HOST:5432/bridgex

# --- Redis ---
# Note: some codepaths use a fixed localhost config in src/api/bullmq-demo/redis.ts
REDIS_URL=redis://127.0.0.1:6379

# --- EVM ---
EVM_RPC_HTTP_URL=https://...
EVM_RPC_WS_URL=wss://...              # optional but recommended
EVM_CHAIN_ID=11155111                 # example: Sepolia
EVM_RELAYER_PRIVATE_KEY=0x...
EVM_BRIDGE_CORE_ADDRESS=0x...

# --- Casper (CSPR.cloud) ---
CASPER_NETWORK=casper_testnet         # casper_testnet | casper_mainnet
CSPR_CLOUD_URL=https://...
CSPR_CLOUD_STREAMING_URL=wss://...
CSPR_CLOUD_ACCESS_KEY=...
CASPER_RELAYER_PRIVATE_KEY=...
CASPER_BRIDGE_CORE_HASH=...
CASPER_DEPLOY_START_HEIGHT=0
CASPER_REORG_BUFFER=2

# Exactly ONE of these:
CASPER_CONTRACT_HASH=hash-...
# CASPER_CONTRACT_PACKAGE_HASH=hash-...
```

### Database Setup

```bash
pnpm run generate
pnpm run migrate
# or for quick dev syncing (be careful in prod):
# pnpm run push
```

### Run

```bash
pnpm run dev
```

The server bootstraps listeners + worker from `src/api/index.ts`.

## Backfill / Catch-up

If the relayer was offline, you can run an EVM backfill to process historical `LockedCanonical` events.

- Processor: `src/api/chains/evm/backFillProcessors.ts`
- Range selection: `src/api/chains/evm/backfill.ts` + `NetworkStatus` table

In `src/api/index.ts`, you can enable the one-shot backfill at startup:

```ts
// await runEvmBackfillOnce();
```

### Casper Backfill

Casper backfill follows the same flow (range → query → persist → enqueue → advance status), using **CSPR.cloud REST** for historical `contract-events`.

- Processor: `src/api/chains/casper/backFillProcessors.ts`
- Range selection: `src/api/chains/casper/backfill.ts` + `NetworkStatus` table (stores last processed **block height** for `CASPER`)

Enable it at startup in `src/api/index.ts`:

```ts
// await runCasperBackfillOnce();
```

## API Endpoints (Dev/Test)

This repo currently exposes minimal test endpoints:

- `POST /api/v1/tests` — calls `BridgeCore.lockCanonical(...)` (hardcoded params)
- `POST /api/v1/tests/approve` — ERC20 approve (hardcoded token/bridge)

These are intended for local testing and will likely be replaced by a proper admin/operator API.

## Notes / Operational Considerations

- **Idempotency:** Events are persisted with a deterministic `eventId` and jobs use `jobId = eventId`.
- **Reorg safety:** EVM backfill uses a reorg buffer (see `src/api/chains/evm/config.ts`).
- **Reliability:** BullMQ retries failed jobs with exponential backoff.

## License

TBD
