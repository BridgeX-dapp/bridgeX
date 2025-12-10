import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * BridgeCoreModule
 *
 * Deploys the BridgeCore contract and applies base configuration.
 * This module is intended to be reused by:
 *  - token onboarding modules
 *  - wrapped token deployment modules
 *  - orchestration scripts
 */
export default buildModule("BridgeCoreModule", (m) => {
  // ---------------------------------------------------------------------------
  // Parameters
  // ---------------------------------------------------------------------------

   const initialOwner = m.getParameter("initialOwner");
  const relayer = m.getParameter("relayer");
  const feeReceiver = m.getParameter("feeReceiver");
  const feeBps = m.getParameter("feeBps", 100n); // default: 1%

  // ---------------------------------------------------------------------------
  // Deploy BridgeCore
  // ---------------------------------------------------------------------------

  const bridgeCore = m.contract("BridgeCore", [
    initialOwner,
    feeReceiver,
    relayer,
  ]);

  // ---------------------------------------------------------------------------
  // Initial configuration
  // ---------------------------------------------------------------------------

  m.call(bridgeCore, "setFeeBps", [feeBps]);

  // ---------------------------------------------------------------------------
  // Exports
  // ---------------------------------------------------------------------------

  return {
    bridgeCore,
  };
});
