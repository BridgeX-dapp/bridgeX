import { Wallet } from 'ethers';
import { loadEvmConfig } from './config';
import { createEvmProviders } from './provider';

export function createEvmSigner(): Wallet {
  const config = loadEvmConfig();
  const { httpProvider } = createEvmProviders();

  const signer = new Wallet(config.EVM_RELAYER_PRIVATE_KEY, httpProvider);

  return signer;
}
