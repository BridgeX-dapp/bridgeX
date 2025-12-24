import { providers } from 'ethers';
import { createEvmProviders } from './provider';
import { getEvmBackfillRange } from './backfill';
import { queryLockedCanonicalEvents } from './backFillEvents';
import { logger } from '../../lib/utils/logger';
import { persistLockedCanonicalEvent } from './persistLockedEvent';
import { updateEvmNetworkStatus } from './networkStatus';
import { enqueueLockedCanonical } from '../../lib/utils/jobs/queue/enqueue';
import { generateEventId } from '../../lib/utils/eventId';
import { EvmChainConfig, loadEvmChainConfigs, loadEvmConfig } from './config';

function getChainKey(config: EvmChainConfig) {
  return `evm:${config.name}`;
}

export async function runEvmBackfillOnce(chainConfig?: EvmChainConfig) {
  const config = chainConfig ?? loadEvmConfig();
  const { httpProvider } = createEvmProviders(config);

  const provider: providers.Provider = httpProvider;

  const { fromBlock, toBlock } = await getEvmBackfillRange(provider, config);

  if (fromBlock > toBlock) {
    logger.info({ chain: config.name }, 'No EVM backfill required');
    return;
  }

  const events = await queryLockedCanonicalEvents(
    provider,
    fromBlock,
    toBlock,
    config,
  );

  logger.info(
    { chain: config.name, count: events.length },
    'EVM backfill events ready for processing',
  );

  for (const ev of events) {
    try {
      await persistLockedCanonicalEvent(ev, config);

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
        { chain: config.name, err, txHash: ev.txHash },
        'Failed to backfill LockedCanonical event',
      );
      throw err;
    }
  }

  await updateEvmNetworkStatus(getChainKey(config), toBlock);
}

export async function runAllEvmBackfillsOnce() {
  const configs = loadEvmChainConfigs();
  if (configs.length === 0) {
    await runEvmBackfillOnce(loadEvmConfig());
    return;
  }

  for (const config of configs) {
    await runEvmBackfillOnce(config);
  }
}
