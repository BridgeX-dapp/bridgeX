# BridgeX Protocol Overview

BridgeX is a cross-chain bridge protocol that connects EVM networks and Casper through a unified relayer service. It is designed for rapid iteration in MVP/hackathon settings, while keeping a clear path toward decentralized validation and governance.

## What BridgeX Does

- **Move assets across chains**: Lock canonical assets on a source chain and mint wrapped assets on the destination chain, or burn wrapped assets to unlock canonical assets.
- **Normalize cross-chain events**: Convert chain-specific events into a shared, chain-agnostic transaction format.
- **Provide real-time visibility**: Live transaction streaming for frontend UIs and monitoring.
- **Maintain operational safety**: Idempotency, replay protection, and confirmation polling for on-chain finality.

## Architecture at a Glance

```
Source Chain      BridgeX Relayer              Destination Chain
------------      -----------------            ------------------
Lock/Burn  --->   Listener -> Normalizer  --->  Mint/Unlock
  Event            EventId -> Persisted          Tx Submitted
                   Job Enqueued -> Executor      Tx Confirmed
```

### Core Components

- **Chain adapters** (EVM, Casper): Signers, providers, listeners, and contract helpers live per-chain.
- **Normalizers**: Translate raw events into a unified format for executors.
- **Executors**: Chain-agnostic job runners that perform mint/unlock actions.
- **Persistence layer**: Database-backed state for transactions, token registry, and mapping.
- **Confirmation poller**: Updates execution status only after on-chain confirmation.

## Trust Model (MVP)

**Current state:** a **single relayer** executes cross-chain actions.

This is a common and acceptable trust model for MVPs:
- **Fast iteration and low operational complexity**
- **Clear failure modes**
- **Simple to audit**

We explicitly treat this as a *temporary* trust assumption and design the system to evolve toward decentralization without re-architecting the entire stack.

## Future Decentralization Roadmap

We plan to decentralize in progressive stages, increasing security while keeping product momentum.

### Phase 1: Multi-Relayer Quorum (M-of-N)

Goal: require **multiple independent relayers** to authorize a destination action.

Changes:
- Add validator/relayer registry on-chain
- Require M-of-N signatures for `mint` / `unlock`
- Extend executors to wait for quorum
- Store signature bundles in DB

Result: no single relayer can bridge funds alone.

### Phase 2: Validator Set + Slashing

Goal: ensure relayers have economic incentives to act honestly.

Changes:
- Validators stake collateral
- On-chain rules to slash for conflicting signatures or invalid submissions
- Transparent validator performance metrics

Result: financial disincentives against malicious behavior.

### Phase 3: Light Client / Proof Verification

Goal: remove reliance on off-chain signatures.

Changes:
- Verify proof of source-chain events on destination chain
- Use light-client proofs or chain-specific finality proofs
- Minimize trusted off-chain components

Result: cryptographic security based on chain state, not relayer trust.

### Phase 4: Decentralized Governance

Goal: community-led upgrades and policy changes.

Changes:
- Governance contract controlling validator set and system parameters
- On-chain voting and timelocks
- Transparent, auditable change history

Result: protocol upgrades are community-driven, not operator-driven.

## Why This Roadmap Is Realistic

- The current architecture already separates **listeners**, **executors**, and **validation logic**.
- Adding validator signatures fits naturally into the executor pipeline.
- Token registry and chain metadata already exist, supporting multi-chain governance.

## Security & Reliability Considerations

Even in MVP mode, BridgeX includes:
- **Replay protection** with event IDs
- **Idempotent job handling**
- **On-chain confirmation checks** before final execution state
- **Configurable reorg buffers**

These make the system safer today and reduce friction when upgrading to decentralization.

## Summary

BridgeX is built to ship fast **without compromising the future**.  
It starts as a centralized relayer for MVP velocity, but it is architected to evolve into a decentralized protocol with validator quorum, cryptographic verification, and community governance.

If you are evaluating BridgeX for a hackathon, the key takeaway is:
**we deliver immediate user value while preserving a credible path to trustless security.**
