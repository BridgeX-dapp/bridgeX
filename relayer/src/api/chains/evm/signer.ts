import { Wallet } from 'ethers';
import { EvmChainConfig, loadEvmConfig } from './config';
import { createEvmProviders } from './provider';

export function createEvmSigner(chainConfig?: EvmChainConfig): Wallet {
  const config = chainConfig ?? loadEvmConfig();
  const { httpProvider } = createEvmProviders(chainConfig);

  const signer = new Wallet(
    config.relayerPrivateKey,
    httpProvider,
  );

  return signer;
}
