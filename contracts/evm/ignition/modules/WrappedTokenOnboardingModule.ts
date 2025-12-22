import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BridgeCoreModule from "./BridgeCoreModule.js";

/**
 * TokenOnboardingModule
 *
 * Registers an already-deployed canonical ERC20 token
 * into the BridgeCore.
 *
 * No contracts are deployed here.
 */
export default buildModule("WrappedTokenOnboardingModule", (m) => {
  // ---------------------------------------------------------------------------
  // Parameters
  // ---------------------------------------------------------------------------

  const token = m.getParameter("token"); // existing ERC20 address
  const minAmount = m.getParameter("minAmount", 0n);
  const maxAmount = m.getParameter("maxAmount", 0n);

  // ---------------------------------------------------------------------------
  // Dependencies
  // ---------------------------------------------------------------------------

  const { bridgeCore } = m.useModule(BridgeCoreModule);

  // ---------------------------------------------------------------------------
  // Register canonical token
  // ---------------------------------------------------------------------------

  m.call(bridgeCore, "setTokenConfig", [
    token,
    true,  // isWhitelisted
    false,  // isCanonical
    minAmount,
    maxAmount,
  ]);

  // ---------------------------------------------------------------------------
  // Exports
  // ---------------------------------------------------------------------------

  return {
    bridgeCore,
  };
});
