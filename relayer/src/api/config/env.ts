import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // EVM
  EVM_RPC_HTTP: z.string().url(),
  EVM_RPC_WS: z.string().url().optional(),

  // Casper
  CASPER_RPC: z.string().url(),
  CASPER_EVENT_STREAM: z.string().url(),

  // Relayer
  EVM_RELAYER_PRIVATE_KEY: z.string().min(1),
  CASPER_RELAYER_KEY_PATH: z.string().min(1),

  // DB
  DATABASE_URL: z.string().url(),

  // Queue
  REDIS_URL: z.string().url(),
});

export const env = EnvSchema.parse(process.env);
