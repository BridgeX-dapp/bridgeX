import { providers } from 'ethers';
import { EvmChainConfig, loadEvmConfig } from './config';
import { logger } from '../../lib/utils/logger';
import prisma from '../../lib/utils/clients/prisma-client';

function getChainKey(config: EvmChainConfig) {
  return `evm:${config.name}`;
}

export async function getEvmBackfillRange(
  provider: providers.Provider,
  chainConfig?: EvmChainConfig,
): Promise<{ fromBlock: number; toBlock: number }> {
  const config = chainConfig ?? loadEvmConfig();
  const chainKey = getChainKey(config);

  const latestBlock = await provider.getBlockNumber();

  const networkStatus = await prisma.networkStatus.findUnique({
    where: { chain: chainKey },
  });

  let fromBlock: number;

  if (!networkStatus) {
    fromBlock = config.deployBlock;

    logger.info(
      { chain: config.name, fromBlock },
      'No EVM NetworkStatus found; starting from deploy block',
    );
  } else {
    const last = Number(networkStatus.lastProcessedBlock);
    const deployBlock = config.deployBlock;
    const reorgBuffer = config.reorgBuffer;

    fromBlock = Math.max(last - reorgBuffer, deployBlock);

    logger.info(
      {
        chain: config.name,
        lastProcessedBlock: last,
        fromBlock,
      },
      'Resuming EVM backfill from last processed block',
    );
  }

  return {
    fromBlock,
    toBlock: latestBlock,
  };
}
