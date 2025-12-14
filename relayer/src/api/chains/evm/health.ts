import { utils } from 'ethers';
import { loadEvmConfig } from './config';
import { createEvmProviders } from './provider';
import { createEvmSigner } from './signer';
import { logger } from '../../lib/utils/logger';
import { bigint } from 'zod';

export async function checkEvmHealth(): Promise<void> {
  const config = loadEvmConfig();
  const { httpProvider } = createEvmProviders();
  const signer = createEvmSigner();

  // 1. Check RPC connectivity
  const network = await httpProvider.getNetwork();
  if (network.chainId !== config.EVM_CHAIN_ID) {
    throw new Error(
      `EVM chainId mismatch. Expected ${config.EVM_CHAIN_ID}, got ${network.chainId}`,
    );
  }

  // 2. Check signer address
  const address = await signer.getAddress();
  if (!address) {
    throw new Error('Relayer signer address not found');
  }

  // 3. Check balance
  const balance = await httpProvider.getBalance(address);

  logger.info(
    {
      chainId: network.chainId.toString(),
      relayer: address,
      balance: utils.formatEther(balance),
    },
    '✅ EVM health check passed',
  );

  /* if (balance === (0)) {
    logger.warn('⚠️ Relayer has zero ETH balance');
  }*/
}
