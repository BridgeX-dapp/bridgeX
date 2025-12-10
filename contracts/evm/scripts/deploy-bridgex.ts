import hre from "hardhat";
import path from "path";

import BridgeCoreModule from "../ignition/modules/BridgeCoreModule.js";
import TokenOnboardingModule from "../ignition/modules/TokenOnboardingModule.js";
import WrappedTokenModule from "../ignition/modules/WrappedTokenModule.js";

async function main() {
  // ---------------------------------------------------------------------------
  // Connect to network (Hardhat v3)
  // ---------------------------------------------------------------------------

  const connection = await hre.network.connect();
  const { ignition } = connection;

  // ---------------------------------------------------------------------------
  // STEP 1 — Deploy BridgeCore
  // ---------------------------------------------------------------------------

  console.log("🚀 Deploying BridgeCore...");

  const { bridgeCore } = await ignition.deploy(BridgeCoreModule, {
    parameters: {
        
      relayer: "0xRELAYER_ADDRESS",
      feeReceiver: "0xFEE_RECEIVER_ADDRESS",
      feeBps: 100n, // 1%
    },
  });

  console.log("✅ BridgeCore deployed at:", bridgeCore.address);

  // ---------------------------------------------------------------------------
  // STEP 2 — Onboard Canonical Token (e.g. USDC)
  // ---------------------------------------------------------------------------

  console.log("🔗 Onboarding canonical token (USDC)...");

  await ignition.deploy(TokenOnboardingModule, {
    parameters: {
      token: "0xUSDC_ADDRESS",
      minAmount: 1n,
      maxAmount: 1_000_000n,
    },
  });

  console.log("✅ USDC onboarded");

  // ---------------------------------------------------------------------------
  // STEP 3 — Deploy Wrapped Token (e.g. wrapped CSPR)
  // ---------------------------------------------------------------------------

  console.log("🪙 Deploying wrapped token...");

  const { wrappedToken } = await ignition.deploy(WrappedTokenModule, {
    parameters: {
      wrappedName: "Wrapped CSPR",
      wrappedSymbol: "wCSPR",
      wrappedDecimals: 18,
      minAmount: 1n,
      maxAmount: 500_000n,
    },
  });

  console.log("✅ Wrapped token deployed at:", wrappedToken.address);

  // ---------------------------------------------------------------------------
  // Done
  // ---------------------------------------------------------------------------

  console.log("\n🎉 BridgeX deployment complete!");
  console.log("BridgeCore:", bridgeCore.address);
  console.log("Wrapped Token:", wrappedToken.address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
