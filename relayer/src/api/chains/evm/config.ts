import { z } from 'zod';

type EvmChainEnv = {
  name: string;
  httpUrl: string;
  wsUrl?: string;
  chainId: number;
  bridgeCoreAddress: string;
  relayerPrivateKey: string;
  deployBlock?: number;
  reorgBuffer?: number;
};

const evmChainSchema = z.object({
  name: z.string().min(1),
  httpUrl: z.string().url(),
  wsUrl: z.string().url().optional(),
  chainId: z.number(),
  bridgeCoreAddress: z.string().min(1),
  relayerPrivateKey: z.string().min(1),
  deployBlock: z.number().optional(),
  reorgBuffer: z.number().optional(),
});

export type EvmChainConfig = z.infer<typeof evmChainSchema>;

const legacyConfigSchema = z.object({
  EVM_RPC_HTTP_URL: z.string().url(),
  EVM_RPC_WS_URL: z.string().url().optional(),
  EVM_RELAYER_PRIVATE_KEY: z.string().min(1),
  EVM_CHAIN_ID: z.number(),
  EVM_DEPLOY_BLOCK: z.number(),
  EVM_REORG_BUFFER: z.number(),
  EVM_BRIDGE_CORE_ADDRESS: z.string().min(1),
});

export type EvmConfig = z.infer<typeof legacyConfigSchema> & {
  name: string;
  httpUrl: string;
  wsUrl?: string;
  chainId: number;
  bridgeCoreAddress: string;
  relayerPrivateKey: string;
  deployBlock: number;
  reorgBuffer: number;
};

function normalizeChainName(name: string) {
  return name.trim().toLowerCase();
}

function envKey(name: string) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function loadChainFromEnv(name: string): EvmChainEnv {
  const key = envKey(name);
  const httpUrl = process.env[`EVM_${key}_RPC_HTTP_URL`];
  const wsUrl = process.env[`EVM_${key}_RPC_WS_URL`];
  const chainId = Number(process.env[`EVM_${key}_CHAIN_ID`]);
  const bridgeCoreAddress = process.env[`EVM_${key}_BRIDGE_CORE_ADDRESS`];
  const relayerPrivateKey =
    process.env[`EVM_${key}_RELAYER_PRIVATE_KEY`] ??
    process.env.EVM_RELAYER_PRIVATE_KEY ??
    '';
  const deployBlockRaw = process.env[`EVM_${key}_DEPLOY_BLOCK`];
  const reorgBufferRaw = process.env[`EVM_${key}_REORG_BUFFER`];

  return {
    name: normalizeChainName(name),
    httpUrl: httpUrl ?? '',
    wsUrl,
    chainId,
    bridgeCoreAddress: bridgeCoreAddress ?? '',
    relayerPrivateKey,
    deployBlock: deployBlockRaw ? Number(deployBlockRaw) : undefined,
    reorgBuffer: reorgBufferRaw ? Number(reorgBufferRaw) : undefined,
  };
}

export function loadEvmChainConfigs(): EvmChainConfig[] {
  const chainList = process.env.EVM_CHAINS;

  if (!chainList) {
    return [];
  }

  const names = chainList
    .split(',')
    .map((n) => normalizeChainName(n))
    .filter(Boolean);

  if (names.length === 0) {
    return [];
  }

  return names.map((name) => {
    const raw = loadChainFromEnv(name);
    const parsed = evmChainSchema.safeParse({
      name: raw.name,
      httpUrl: raw.httpUrl,
      wsUrl: raw.wsUrl,
      chainId: raw.chainId,
      bridgeCoreAddress: raw.bridgeCoreAddress,
      relayerPrivateKey: raw.relayerPrivateKey,
      deployBlock: raw.deployBlock ?? 0,
      reorgBuffer: raw.reorgBuffer ?? 5,
    });

    if (!parsed.success) {
      console.error('Invalid EVM chain config', name, parsed.error.format());
      throw new Error('Invalid EVM chain configuration');
    }

    return parsed.data;
  });
}

export function loadEvmConfig(): EvmConfig {
  const configs = loadEvmChainConfigs();
  const defaultName = process.env.EVM_DEFAULT_CHAIN;

  if (configs.length > 0) {
    const match = defaultName
      ? configs.find((c) => c.name === normalizeChainName(defaultName))
      : configs[0];
    if (!match) {
      throw new Error('EVM_DEFAULT_CHAIN does not match any configured chain');
    }

    return {
      ...legacyConfigSchema.parse({
        EVM_RPC_HTTP_URL: match.httpUrl,
        EVM_RPC_WS_URL: match.wsUrl,
        EVM_RELAYER_PRIVATE_KEY: process.env.EVM_RELAYER_PRIVATE_KEY,
        EVM_CHAIN_ID: match.chainId,
        EVM_DEPLOY_BLOCK: match.deployBlock ?? 0,
        EVM_REORG_BUFFER: match.reorgBuffer ?? 5,
        EVM_BRIDGE_CORE_ADDRESS: match.bridgeCoreAddress,
      }),
      name: match.name,
      httpUrl: match.httpUrl,
      wsUrl: match.wsUrl,
      chainId: match.chainId,
      bridgeCoreAddress: match.bridgeCoreAddress,
      relayerPrivateKey:
        process.env.EVM_RELAYER_PRIVATE_KEY ?? match.relayerPrivateKey,
      deployBlock: match.deployBlock ?? 0,
      reorgBuffer: match.reorgBuffer ?? 5,
    };
  }

  const parsed = legacyConfigSchema.safeParse({
    EVM_RPC_HTTP_URL: process.env.EVM_RPC_HTTP_URL,
    EVM_RPC_WS_URL: process.env.EVM_RPC_WS_URL,
    EVM_RELAYER_PRIVATE_KEY: process.env.EVM_RELAYER_PRIVATE_KEY,
    EVM_CHAIN_ID: Number(process.env.EVM_CHAIN_ID),
    EVM_DEPLOY_BLOCK: Number(process.env.EVM_DEPLOY_BLOCK ?? 0),
    EVM_REORG_BUFFER: Number(process.env.EVM_REORG_BUFFER ?? 5),
    EVM_BRIDGE_CORE_ADDRESS: process.env.EVM_BRIDGE_CORE_ADDRESS,
  });

  if (!parsed.success) {
    console.error('Invalid EVM config', parsed.error.format());
    throw new Error('Invalid EVM configuration');
  }

  return {
    ...parsed.data,
    name: 'evm',
    httpUrl: parsed.data.EVM_RPC_HTTP_URL,
    wsUrl: parsed.data.EVM_RPC_WS_URL,
    chainId: parsed.data.EVM_CHAIN_ID,
    bridgeCoreAddress: parsed.data.EVM_BRIDGE_CORE_ADDRESS,
    relayerPrivateKey: parsed.data.EVM_RELAYER_PRIVATE_KEY,
    deployBlock: parsed.data.EVM_DEPLOY_BLOCK,
    reorgBuffer: parsed.data.EVM_REORG_BUFFER,
  };
}

export function resolveEvmChainConfig(chain?: string) {
  if (!chain) {
    return loadEvmConfig();
  }

  const configs = loadEvmChainConfigs();
  if (configs.length === 0) {
    throw new Error('EVM_CHAINS not configured');
  }

  const normalized = normalizeChainName(chain);
  const match = configs.find((cfg) => cfg.name === normalized);
  if (!match) {
    throw new Error(`Unknown EVM chain: ${chain}`);
  }

  return match;
}
