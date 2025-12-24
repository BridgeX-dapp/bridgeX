import { providers } from 'ethers';
import { EvmChainConfig, loadEvmConfig } from './config';

export interface EvmProviders {
  httpProvider: providers.JsonRpcProvider;
  wsProvider?: providers.WebSocketProvider;
}

export function createEvmProviders(chainConfig?: EvmChainConfig): EvmProviders {
  const config = chainConfig ?? loadEvmConfig();

  const httpProvider = new providers.JsonRpcProvider(
    config.httpUrl,
    config.chainId,
  );

  let wsProvider: providers.WebSocketProvider | undefined;
  const wsUrl = config.wsUrl;
  if (wsUrl) {
    wsProvider = new providers.WebSocketProvider(wsUrl, config.chainId);
  }

  return {
    httpProvider,
    wsProvider,
  };
}
