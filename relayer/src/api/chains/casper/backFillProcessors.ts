import { createCasperRestClient } from './provider';
import { getCasperBackfillRange } from './backfill';
import { queryCasperLockedCanonicalEvents } from './backFillEvents';
import { logger } from '../../lib/utils/logger';
import { persistCasperLockedCanonicalEvent } from './persistLockedEvent';
import { updateCasperNetworkStatus } from './networkStatus';
import { enqueueLockedCanonical } from '../../lib/utils/jobs/queue/enqueue';
import { generateEventId } from '../../lib/utils/eventId';

export async function runCasperBackfillOnce() {
  const client = createCasperRestClient();

  // 1) Decide height range
  const { fromBlock, toBlock } = await getCasperBackfillRange(client);

  if (fromBlock > toBlock) {
    logger.info('No CASPER backfill required');
    return;
  }

  // 2) Fetch historical events
  const events = await queryCasperLockedCanonicalEvents(
    client,
    fromBlock,
    toBlock,
  );

  logger.info(
    { count: events.length },
    'CASPER backfill events ready for processing',
  );

  // 3) Persist + enqueue jobs (idempotent)
  for (const ev of events) {
    try {
      await persistCasperLockedCanonicalEvent(ev);

      const eventId = generateEventId({
        sourceChain: ev.sourceChain,
        txHash: ev.txHash,
        logIndex: ev.logIndex,
        token: ev.token,
        amount: ev.amount,
        nonce: ev.nonce,
        destChainId: ev.destChainId,
        destAddress: ev.destAddress,
      });

      await enqueueLockedCanonical(eventId);
    } catch (err) {
      logger.error(
        { err, txHash: ev.txHash, blockNumber: ev.blockNumber },
        'Failed to backfill Casper LockedCanonical event',
      );
      // IMPORTANT: do NOT advance NetworkStatus if failures happen
      throw err;
    }
  }

  // 4) Only update AFTER successful processing
  await updateCasperNetworkStatus(toBlock);
}
