import { providers } from 'ethers';
import { loadEvmConfig } from './config';
import { logger } from '../../lib/utils/logger';
import prisma from '../../lib/utils/clients/prisma-client';

export async function getEvmBackfillRange(
  provider: providers.Provider,
): Promise<{ fromBlock: number; toBlock: number }> {
  const config = loadEvmConfig();

  const latestBlock = await provider.getBlockNumber();

  const networkStatus = await prisma.networkStatus.findUnique({
    where: { chain: 'EVM' },
  });

  let fromBlock: number;

  if (!networkStatus) {
    // 🟢 First run
    fromBlock = config.EVM_DEPLOY_BLOCK;

    logger.info(
      { fromBlock },
      'No EVM NetworkStatus found — starting from deploy block',
    );
  } else {
    const last = Number(networkStatus.lastProcessedBlock);

    fromBlock = Math.max(
      last - config.EVM_REORG_BUFFER,
      config.EVM_DEPLOY_BLOCK,
    );

    logger.info(
      {
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
