import { z } from 'zod';

const evmConfigSchema = z.object({
  EVM_RPC_HTTP_URL: z.string().url(),
  EVM_RPC_WS_URL: z.string().url().optional(),
  EVM_RELAYER_PRIVATE_KEY: z.string().min(1),
  EVM_CHAIN_ID: z.number(),
  EVM_DEPLOY_BLOCK: z.number(),
  EVM_REORG_BUFFER: z.number(),
  EVM_BRIDGE_CORE_ADDRESS: z.string().min(1),
});

export type EvmConfig = z.infer<typeof evmConfigSchema>;

export function loadEvmConfig(): EvmConfig {
  const parsed = evmConfigSchema.safeParse({
    EVM_RPC_HTTP_URL: process.env.EVM_RPC_HTTP_URL,
    EVM_RPC_WS_URL: process.env.EVM_RPC_WS_URL,
    EVM_RELAYER_PRIVATE_KEY: process.env.EVM_RELAYER_PRIVATE_KEY,
    EVM_CHAIN_ID: Number(process.env.EVM_CHAIN_ID),
    EVM_DEPLOY_BLOCK: 12345678,
    EVM_REORG_BUFFER: 5,
    EVM_BRIDGE_CORE_ADDRESS: process.env.EVM_BRIDGE_CORE_ADDRESS,
  });

  if (!parsed.success) {
    console.error('❌ Invalid EVM config', parsed.error.format());
    throw new Error('Invalid EVM configuration');
  }

  return parsed.data;
}
