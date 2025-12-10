# BridgeX — Development Notes (Work in Progress)

This repository contains the EVM-side implementation of **BridgeX**, a modular cross-chain bridge architecture.

---

## ✅ Current Progress (Last Session)

### 1. Core Architecture
- Designed a **single BridgeCore contract** per chain
- Supports **multiple canonical and wrapped tokens**
- Implements:
  - lock → mint
  - burn → unlock
  - replay protection (eventId tracking)
  - configurable fees
  - relayer-based execution (v1)
  - pausability

---

### 2. Smart Contracts Implemented
- `BridgeCore.sol`
  - Core bridge logic
  - Token configuration registry
  - Fee model
  - Relayer execution
  - On-chain replay protection

- `WrappedToken.sol`
  - ERC20 wrapped asset
  - Mint / burn restricted to BridgeCore
  - Used for remote-chain canonical assets

- `MockERC20.sol`
  - Used only for local testing
  - Simulates canonical ERC20 assets (USDC/DAI-style)

---

### 3. Testing (Status: Partial / In Progress)
- Test suite written using **Hardhat v3 + viem + node:test**
- Covers:
  - canonical token locking
  - wrapped token minting & burning
  - replay protection
  - fee logic
  - pausability

⚠️ **Tests are written but not fully stabilized yet.**  
Some failures and edge cases are expected and will be addressed in the next session.

---

## 🚀 Deployment Architecture (LATEST FOCUS)

The latest development focus was building a **real-world deployment pipeline** using **Hardhat Ignition (v3)**.

### Ignition Modules Created

#### ✅ `BridgeCoreModule`
- Deploys BridgeCore
- Sets:
  - relayer
  - fee receiver
  - protocol fee (bps)
- Intended to be deployed **once per chain**

#### ✅ `WrappedTokenModule`
- Deploys a wrapped ERC20 token
- Automatically registers it in BridgeCore
- Reusable for onboarding multiple wrapped assets

#### ✅ `TokenOnboardingModule`
- Registers an existing ERC20 as a canonical token
- No deployment — config only
- Reusable for onboarding USDC, USDT, DAI, etc.

---

### Orchestration Script

- `scripts/deploy-bridgex.ts`
- Uses `hre.network.connect()` + `connection.ignition.deploy()`
- Invokes Ignition modules step-by-step
- Designed to:
  - deploy core infra
  - onboard tokens incrementally
  - print deployed addresses for reuse

This mirrors **real-world protocol deployment workflows**
