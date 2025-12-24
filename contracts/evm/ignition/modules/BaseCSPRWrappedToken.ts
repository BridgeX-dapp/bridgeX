import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import BridgeCoreModule from "./BridgeCoreModule.js";

/**
 * WrappedTokenModule
 *
 * Deploys a wrapped ERC20 token and registers it in BridgeCore.
 * Intended to be reusable for onboarding multiple wrapped assets.
 */
export default buildModule("WrappedTokenModule", (m) => {
  // ---------------------------------------------------------------------------
  // Parameters
  // ---------------------------------------------------------------------------

  const wrappedName = m.getParameter("wrappedName");
  const wrappedSymbol = m.getParameter("wrappedSymbol");
  const wrappedDecimals = m.getParameter("wrappedDecimals", 18);

  const minAmount = m.getParameter("minAmount", 0n);
  const maxAmount = m.getParameter("maxAmount", 0n);

  // ---------------------------------------------------------------------------
  // Dependencies
  // ---------------------------------------------------------------------------

  const { bridgeCore } = m.useModule(BridgeCoreModule);

  // ---------------------------------------------------------------------------
  // Deploy Wrapped Token
  // ---------------------------------------------------------------------------

  const wrappedToken = m.contract("WrappedToken", [
    wrappedName,
    wrappedSymbol,
    bridgeCore,
    wrappedDecimals,
  ]);

  // ---------------------------------------------------------------------------
  // Register Wrapped Token in BridgeCore
  // ---------------------------------------------------------------------------

  m.call(bridgeCore, "setTokenConfig", [
    wrappedToken,
    true,   // isWhitelisted
    false,  // isCanonical
    minAmount,
    maxAmount,
  ]);

  // ---------------------------------------------------------------------------
  // Exports
  // ---------------------------------------------------------------------------

  return {
    wrappedToken,
  };
});
