import { providers, Event } from 'ethers';
import { createEvmProviders } from './provider';
import { getEvmBackfillRange } from './backfill';
import { queryLockedCanonicalEvents } from './backFillEvents';
import { logger } from '../../lib/utils/logger';
import { persistLockedCanonicalEvent } from './persistLockedEvent';
import { normalizeLockedCanonical } from './normalizeLockedCanonicalEvent';
import { updateEvmNetworkStatus } from './networkStatus';

export async function runEvmBackfillOnce() {
  const { httpProvider } = createEvmProviders();

  const provider: providers.Provider = httpProvider;

  // 1️⃣ Decide block range
  const { fromBlock, toBlock } = await getEvmBackfillRange(provider);

  if (fromBlock > toBlock) {
    logger.info('No EVM backfill required');
    return;
  }

  // 2️⃣ Fetch events
  const events = await queryLockedCanonicalEvents(provider, fromBlock, toBlock);

  logger.info(
    { count: events.length },
    'EVM backfill events ready for processing',
  );

  // 👉 Step 3 happens here next:
  // - generate eventId
  // - persist via Prisma

  for (const ev of events) {
    try {
      //const normalized = normalizeLockedCanonical(ev);
      await persistLockedCanonicalEvent(ev);
    } catch (err) {
      logger.error(
        { err, txHash: ev.txHash },
        'Failed to backfill LockedCanonical event',
      );
      // IMPORTANT: do NOT advance network status if failures happen
      throw err;
    }
  }

  // ✅ Only update AFTER successful processing
  await updateEvmNetworkStatus(toBlock);
  // - enqueue BullMQ jobs
}
