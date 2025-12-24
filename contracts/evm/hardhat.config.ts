import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";
import * as dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    },
     somnia: {
      type: "http",
      chainType: "l1",
      url: "https://dream-rpc.somnia.network",
      accounts: ["1624cd89f781ea21740f8a1243b8abea42f6b19e9a873d277ec579e3bcb18a20"], //  dev demo menomonic  PK here,
    },
     baseSepolia: {
      type: "http",
      chainType: "l1",
      url: `https://base-sepolia.g.alchemy.com/v2/${process.env.ALECHMY_APP_ID}`,
      accounts: [process.env.DEPLOY_WALLET!], // put dev menomonic or PK here,
    },
     arbitrumSepolia: {
      type: "http",
      chainType: "l1",
      url: `https://arb-sepolia.g.alchemy.com/v2/${process.env.ALECHMY_APP_ID}`,
      accounts: [process.env.DEPLOY_WALLET!], // put dev menomonic or PK here,
    },
     polygonAmoy: {
      type: "http",
      chainType: "l1",
      url: `https://polygon-amoy.g.alchemy.com/v2/${process.env.ALECHMY_APP_ID}`,
      accounts: [process.env.DEPLOY_WALLET!], // put dev menomonic or PK here,
    },
  },
});
