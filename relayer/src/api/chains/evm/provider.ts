import { providers } from 'ethers';
import { loadEvmConfig } from './config';

export interface EvmProviders {
  httpProvider: providers.JsonRpcProvider;
  wsProvider?: providers.WebSocketProvider;
}

export function createEvmProviders(): EvmProviders {
  const config = loadEvmConfig();

  // HTTP provider (always required)
  const httpProvider = new providers.JsonRpcProvider(
    config.EVM_RPC_HTTP_URL,
    config.EVM_CHAIN_ID,
  );

  // WebSocket provider (optional but recommended)
  let wsProvider: providers.WebSocketProvider | undefined;

  if (config.EVM_RPC_WS_URL) {
    wsProvider = new providers.WebSocketProvider(
      config.EVM_RPC_WS_URL,
      config.EVM_CHAIN_ID,
    );
  }

  return {
    httpProvider,
    wsProvider,
  };
}
