import { AxiosInstance } from 'axios';
import { loadCasperConfig } from './config';
import prisma from '../../lib/utils/clients/prisma-client';
import { logger } from '../../lib/utils/logger';

type LatestHeightResponse =
  | {
      data?: {
        last_added_block_info?: { height?: number };
      };
      last_added_block_info?: { height?: number };
    }
  | any;

async function fetchLatestBlockHeight(client: AxiosInstance): Promise<number> {
  // CSPR.cloud provides a /status endpoint that includes last added block info.
  // This is intentionally defensive because response shapes may differ by network/version.
  const res = await client.get('/status');
  const body = res.data as LatestHeightResponse;

  const height =
    body?.data?.last_added_block_info?.height ??
    body?.last_added_block_info?.height;

  if (typeof height !== 'number' || !Number.isFinite(height)) {
    throw new Error('Unable to determine latest Casper block height from /status');
  }

  return height;
}

export async function getCasperBackfillRange(
  client: AxiosInstance,
): Promise<{ fromBlock: number; toBlock: number }> {
  const cfg = loadCasperConfig();

  const latestHeight = await fetchLatestBlockHeight(client);

  const networkStatus = await prisma.networkStatus.findUnique({
    where: { chain: 'CASPER' },
  });

  let fromBlock: number;

  if (!networkStatus) {
    fromBlock = cfg.CASPER_DEPLOY_START_HEIGHT;

    logger.info(
      { fromBlock },
      'No CASPER NetworkStatus found — starting backfill from deploy start height',
    );
  } else {
    const last = Number(networkStatus.lastProcessedBlock);

    fromBlock = Math.max(last - cfg.CASPER_REORG_BUFFER, cfg.CASPER_DEPLOY_START_HEIGHT);

    logger.info(
      { lastProcessedHeight: last, fromBlock },
      'Resuming CASPER backfill from last processed height (with reorg buffer)',
    );
  }

  return {
    fromBlock,
    toBlock: latestHeight,
  };
}

