import { z } from 'zod';

const casperConfigSchema = z.object({
  CASPER_NETWORK: z.enum(['casper-test', 'casper-mainnet']),

  // CSPR.cloud
  CSPR_CLOUD_URL: z.string().url(),
  CSPR_CLOUD_STREAMING_URL: z.string().url(),
  CSPR_CLOUD_ACCESS_KEY: z.string().min(1),
  CASPER_CHAIN_NAME: z.string().min(1),
  APP_NAME: z.string().min(1),
  CASPER_GAS_PAYMENT: z.string(),
  CSPR_CLICK_APP_ID: z.string().min(1),

  // Relayer url endpoint 
  CASPER_MAIN_RELAYER: z.string().url(),

  // BridgeCore
  CASPER_BRIDGE_CORE_HASH: z.string().min(1),
  CASPER_BRIDGE_CORE_CONTRACT_PACKAGE_HASH: z.string().min(1),

});

export type CasperConfig = z.infer<typeof casperConfigSchema>;

const casperClickConfigSchema = z.object({
  CASPER_NETWORK: z.enum(['casper-test', 'casper-mainnet']),
  CASPER_CHAIN_NAME: z.string().min(1),
  APP_NAME: z.string().min(1),
  CSPR_CLICK_APP_ID: z.string().min(1),
});

export type CasperClickConfig = z.infer<typeof casperClickConfigSchema>;

const casperClientConfigSchema = z.object({
  CASPER_CHAIN_NAME: z.string().min(1),
  CASPER_GAS_PAYMENT: z.string(),
  CASPER_BRIDGE_CORE_HASH: z.string().min(1),
  CASPER_BRIDGE_CORE_CONTRACT_PACKAGE_HASH: z.string().min(1),
  CASPER_MAIN_RELAYER: z.string().url(),
  RELAYER_TX_INITIAL_LIMIT: z.coerce.number().int().positive(),
  RELAYER_TX_INITIAL_MODE: z.enum(["latest", "snapshot"]),
});

export type CasperClientConfig = z.infer<typeof casperClientConfigSchema>;

const evmClientConfigSchema = z.object({
  EVM_WALLETCONNECT_PROJECT_ID: z.string().min(1),
  EVM_DEFAULT_CHAIN_ID: z.coerce.number().int().positive(),
  BASE_SEPOLIA_EVM_BRIDGE_CORE_ADDRESS: z.string().min(1),
  ARBITRUM_SEPOLIA_EVM_BRIDGE_CORE_ADDRESS: z.string().min(1),
  POLYGON_AMOY_EVM_BRIDGE_CORE_ADDRESS: z.string().min(1),
  EVM_BRIDGE_CORE_ADDRESS: z.string().optional(),
  ALCHEMY_API_KEY: z.string().min(1),
  BASE_SEPOLIA_RPC_URL: z.string().url(),
  BASE_SEPOLIA_WS_RPC_URL: z.string().url(),
  ARBITRUM_SEPOLIA_RPC_URL: z.string().url(),
  ARBITRUM_SEPOLIA_WS_RPC_URL: z.string().url(),
  POLYGON_AMOY_RPC_URL: z.string().url(),
  POLYGON_AMOY_WS_RPC_URL: z.string().url(),
});

export type EvmClientConfig = z.infer<typeof evmClientConfigSchema>;

export function loadCasperClickConfig(): CasperClickConfig {
  const parsed = casperClickConfigSchema.safeParse({
    CASPER_NETWORK: process.env.CASPER_NETWORK,
    CASPER_CHAIN_NAME: process.env.CASPER_CHAIN_NAME,
    APP_NAME: process.env.APP_NAME ?? process.env.APP_NAMEE,
    CSPR_CLICK_APP_ID: process.env.CSPR_CLICK_APP_ID,
  });

  if (!parsed.success) {
    console.error('Invalid Casper Click config', parsed.error.format());
    throw new Error('Invalid Casper Click configuration');
  }

  return parsed.data;
}

export function loadCasperClientConfig(): CasperClientConfig {
  const parsed = casperClientConfigSchema.safeParse({
    CASPER_CHAIN_NAME: process.env.CASPER_CHAIN_NAME,
    CASPER_GAS_PAYMENT: process.env.CASPER_GAS_PAYMENT,
    CASPER_BRIDGE_CORE_HASH: process.env.CASPER_BRIDGE_CORE_HASH,
    CASPER_BRIDGE_CORE_CONTRACT_PACKAGE_HASH:
      process.env.CASPER_BRIDGE_CORE_CONTRACT_PACKAGE_HASH,
    CASPER_MAIN_RELAYER: process.env.CASPER_MAIN_RELAYER,
    RELAYER_TX_INITIAL_LIMIT: process.env.RELAYER_TX_INITIAL_LIMIT ?? "6",
    RELAYER_TX_INITIAL_MODE: process.env.RELAYER_TX_INITIAL_MODE ?? "latest",
  });

  if (!parsed.success) {
    console.error('Invalid Casper client config', parsed.error.format());
    throw new Error('Invalid Casper client configuration');
  }

  return parsed.data;
}

export function loadCasperConfig(): CasperConfig {
  const parsed = casperConfigSchema.safeParse({
    CASPER_NETWORK: process.env.CASPER_NETWORK,
    CASPER_GAS_PAYMENT: process.env.CASPER_GAS_PAYMENT,
    CSPR_CLOUD_URL: process.env.CSPR_CLOUD_URL,
    CSPR_CLOUD_STREAMING_URL: process.env.CSPR_CLOUD_STREAMING_URL,
    CSPR_CLOUD_ACCESS_KEY: process.env.CSPR_CLOUD_ACCESS_KEY,
    CASPER_RPC_URL: process.env.CASPER_RPC_URL,
    CSPR_CLICK_APP_ID: process.env.CSPR_CLICK_APP_ID,
    CASPER_CHAIN_NAME: process.env.CASPER_CHAIN_NAME,
    APP_NAME: process.env.APP_NAME ?? process.env.APP_NAMEE,
    CASPER_BRIDGE_CORE_CONTRACT_PACKAGE_HASH:
      process.env.CASPER_BRIDGE_CORE_CONTRACT_PACKAGE_HASH,

    CASPER_MAIN_RELAYER: process.env.CASPER_MAIN_RELAYER,

    CASPER_BRIDGE_CORE_HASH: process.env.CASPER_BRIDGE_CORE_HASH,

    PING_CHECK_INTERVAL_IN_MILLSECCONDS: 60000,
    // filter target (use ONE of them, but package hash is recommended)
    CASPER_CONTRACT_PACKAGE_HASH: process.env.CASPER_CONTRACT_PACKAGE_HASH,
  });


  if (!parsed.success) {
    console.error('❌ Invalid Casper config', parsed.error.format());
    throw new Error('Invalid Casper configuration');
  }

  const cfg = parsed.data;

  // enforce exactly one filter set
  const hasCaperContract = !!cfg.CASPER_BRIDGE_CORE_HASH;
  const hasCasperPackage = !!cfg.CASPER_CONTRACT_PACKAGE_HASH;
  if (Number(hasCaperContract) + Number(hasCasperPackage) !== 1) {
    throw new Error(
      'Set exactly one of CASPER_BRIDGE_CORE_HASH or CASPER_CONTRACT_PACKAGE_HASH',
    );
  }

  return cfg;
}

export function loadEvmClientConfig(): EvmClientConfig {
  const parsed = evmClientConfigSchema.safeParse({
    EVM_WALLETCONNECT_PROJECT_ID: process.env.EVM_WALLETCONNECT_PROJECT_ID,
    EVM_DEFAULT_CHAIN_ID: process.env.EVM_DEFAULT_CHAIN_ID ?? "84532",
    BASE_SEPOLIA_EVM_BRIDGE_CORE_ADDRESS: process.env.BASE_SEPOLIA_EVM_BRIDGE_CORE_ADDRESS,
    ARBITRUM_SEPOLIA_EVM_BRIDGE_CORE_ADDRESS: process.env.ARBITRUM_SEPOLIA_EVM_BRIDGE_CORE_ADDRESS,
    POLYGON_AMOY_EVM_BRIDGE_CORE_ADDRESS: process.env.POLYGON_AMOY_EVM_BRIDGE_CORE_ADDRESS,
    EVM_BRIDGE_CORE_ADDRESS: process.env.EVM_BRIDGE_CORE_ADDRESS,
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    BASE_SEPOLIA_RPC_URL: process.env.BASE_SEPOLIA_RPC_URL,
    BASE_SEPOLIA_WS_RPC_URL: process.env.BASE_SEPOLIA_WS_RPC_URL,
    ARBITRUM_SEPOLIA_RPC_URL: process.env.ARBITRUM_SEPOLIA_RPC_URL,
    ARBITRUM_SEPOLIA_WS_RPC_URL: process.env.ARBITRUM_SEPOLIA_WS_RPC_URL,
    POLYGON_AMOY_RPC_URL: process.env.POLYGON_AMOY_RPC_URL,
    POLYGON_AMOY_WS_RPC_URL: process.env.POLYGON_AMOY_WS_RPC_URL,
  });

  if (!parsed.success) {
    console.error("Invalid EVM client config", parsed.error.format());
    throw new Error("Invalid EVM client configuration");
  }

  return parsed.data;
}
