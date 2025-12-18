import { AxiosInstance } from 'axios';
import { logger } from '../../lib/utils/logger';
import { loadCasperConfig } from './config';
import { CasperContractEventWSMessage } from './types';
import {
  normalizeCasperLockedCanonical,
  NormalizedCasperLockedCanonicalEvent,
} from './normalizers/normalizeLockedCanonical';

export type NormalizedCasperLockedCanonicalBackfillEvent =
  NormalizedCasperLockedCanonicalEvent & {
    blockNumber: number;
  };

type CasperContractEventRestItem = {
  action?: string;
  timestamp?: string;
  block_height?: number;
  data?: {
    contract_package_hash?: string;
    contract_hash?: string;
    name?: string;
    data?: Record<string, any>;
    raw_data?: string;
  };
  extra?: {
    deploy_hash?: string;
    event_id?: number;
    block_height?: number;
  };
};

function normalizeRestItemToWsMessage(
  item: CasperContractEventRestItem,
): CasperContractEventWSMessage | null {
  const name = item?.data?.name;
  const deployHash = item?.extra?.deploy_hash;
  const eventId = item?.extra?.event_id;
  if (!name || !deployHash || typeof eventId !== 'number') return null;

  return {
    action: 'emitted',
    timestamp: item.timestamp ?? new Date().toISOString(),
    data: {
      contract_package_hash: item.data?.contract_package_hash ?? '',
      contract_hash: item.data?.contract_hash,
      name,
      data: item.data?.data ?? {},
      raw_data: item.data?.raw_data,
    },
    extra: {
      deploy_hash: deployHash,
      event_id: eventId,
    },
  };
}

function extractBlockHeight(item: CasperContractEventRestItem): number | null {
  const h = item?.extra?.block_height ?? item?.block_height;
  if (typeof h !== 'number' || !Number.isFinite(h)) return null;
  return h;
}

export async function queryCasperLockedCanonicalEvents(
  client: AxiosInstance,
  fromBlock: number,
  toBlock: number,
): Promise<NormalizedCasperLockedCanonicalBackfillEvent[]> {
  const cfg = loadCasperConfig();

  const params: Record<string, any> = {
    // match streaming filters
    includes: 'raw_data',
    start_height: fromBlock,
    end_height: toBlock,
    limit: 250,
  };

  if (cfg.CASPER_CONTRACT_HASH) {
    params.contract_hash = cfg.CASPER_CONTRACT_HASH;
  }
  if (cfg.CASPER_CONTRACT_PACKAGE_HASH) {
    params.contract_package_hash = cfg.CASPER_CONTRACT_PACKAGE_HASH;
  }

  const out: NormalizedCasperLockedCanonicalBackfillEvent[] = [];

  logger.info(
    { fromBlock, toBlock },
    'Starting CASPER backfill query for LockedCanonical (paged)',
  );

  let nextCursor: string | number | undefined;

  // CSPR.cloud responses can be paged; we try to follow a next_cursor/next_page token when present.
  // If pagination fields are absent, we treat it as a single page.
  for (let page = 0; page < 10_000; page++) {
    const res = await client.get('/contract-events', {
      params: {
        ...params,
        ...(nextCursor ? { cursor: nextCursor } : null),
      },
    });

    const body = res.data as any;
    const items: CasperContractEventRestItem[] =
      (Array.isArray(body) ? body : null) ??
      body?.data ??
      body?.items ??
      body?.contract_events ??
      [];

    if (!Array.isArray(items) || items.length === 0) break;

    for (const item of items) {
      if (item?.data?.name !== 'LockedCanonical') continue;

      const wsMsg = normalizeRestItemToWsMessage(item);
      if (!wsMsg) continue;

      const normalized = normalizeCasperLockedCanonical(wsMsg);
      const blockNumber = extractBlockHeight(item);

      if (blockNumber === null) {
        // We require a stable ordering cursor to persist into Transaction.sourceBlockNumber.
        // If the provider response doesn’t include a block height, we can’t safely advance NetworkStatus.
        throw new Error(
          'Casper contract-events backfill response missing block_height',
        );
      }

      out.push({ ...normalized, blockNumber });
    }

    nextCursor =
      body?.next_cursor ??
      body?.pagination?.next_cursor ??
      body?.next_page ??
      body?.pagination?.next_page;

    if (!nextCursor) break;
  }

  logger.info({ count: out.length }, 'Finished CASPER backfill query');
  return out;
}

