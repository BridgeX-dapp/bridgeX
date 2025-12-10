import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * BridgeX Ignition Deployment Module
 *
 * This module:
 * 1. Deploys BridgeCore
 * 2. Deploys a WrappedToken
 * 3. Configures fee, relayer, and token settings
 *
 * Designed for Hardhat v3 + Ignition
 */
export default buildModule("BridgeXModule", (m) => {
  // ---------------------------------------------------------------------------
  // Parameters (configurable per network)
  // ---------------------------------------------------------------------------

  const relayer = m.getParameter("relayer"); // address
  const feeReceiver = m.getParameter("feeReceiver"); // address
  const canonicalToken = m.getParameter("canonicalToken"); // address of ERC20
  const feeBps = m.getParameter("feeBps", 100n); // 1% default

  // Wrapped token metadata
  const wrappedName = m.getParameter("wrappedName", "Wrapped CAN");
  const wrappedSymbol = m.getParameter("wrappedSymbol", "wCAN");
  const wrappedDecimals = m.getParameter("wrappedDecimals", 18);

  // ---------------------------------------------------------------------------
  // Deploy BridgeCore
  // ---------------------------------------------------------------------------

  const bridgeCore = m.contract("BridgeCore", [
    feeReceiver,
    relayer,
  ]);

  // Set protocol fee
  m.call(bridgeCore, "setFeeBps", [feeBps]);

  // ---------------------------------------------------------------------------
  // Configure Canonical Token (EVM-native)
  // ---------------------------------------------------------------------------

  m.call(bridgeCore, "setTokenConfig", [
    canonicalToken,
    true,   // isWhitelisted
    true,   // isCanonical
    0n,     // minAmount
    0n,     // maxAmount
  ]);

  // ---------------------------------------------------------------------------
  // Deploy Wrapped Token (for remote-chain canonical asset)
  // ---------------------------------------------------------------------------

  const wrappedToken = m.contract("WrappedToken", [
    wrappedName,
    wrappedSymbol,
    bridgeCore,
    wrappedDecimals,
  ]);

  // Configure Wrapped Token in BridgeCore
  m.call(bridgeCore, "setTokenConfig", [
    wrappedToken,
    true,   // isWhitelisted
    false,  // isCanonical (wrapped)
    0n,     // minAmount
    0n,     // maxAmount
  ]);

  // ---------------------------------------------------------------------------
  // Return deployed contracts
  // ---------------------------------------------------------------------------

  return {
    bridgeCore,
    wrappedToken,
  };
});





// Deployment script

/*npx hardhat ignition deploy ignition/modules/BridgeXModule.ts \
  --parameters '{
    "relayer": "0xRelayerAddress",
    "feeReceiver": "0xFeeReceiverAddress",
    "canonicalToken": "0xCanonicalTokenAddress",
    "feeBps": 100,
    "wrappedName": "Wrapped CAN",
    "wrappedSymbol": "wCAN",
    "wrappedDecimals": 18
  }'*/