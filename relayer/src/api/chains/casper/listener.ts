import { logger } from '../../lib/utils/logger';
import {
  createCasperEventStream,
  createCasperRestClient,
  fetchLatestCasperBlockHeight,
} from './provider';
import { CasperContractEventWSMessage } from './types';
import { normalizeCasperLockedCanonical } from './normalizers/normalizeLockedCanonical';
import { normalizeCasperBurnedWrapped } from './normalizers/normalizeBurnedWrapped';
import { normalizeCasperMintedWrapped } from './normalizers/normalizeMintedWrapped';
import { normalizeCasperUnlockedCanonical } from './normalizers/normalizeUnlockedCanonical';
import { loadCasperConfig } from './config';
import { updateCasperNetworkStatus } from './networkStatus';
import { generateEventIdCore } from '../../lib/utils/crossEventId';
import {
  enqueueCasperBurnedWrapped,
  enqueueCasperLockedCanonical,
} from '../../lib/utils/jobs/queue/enqueue';
import {
  persistCasperSourceEvent,
  updateCasperDestinationStatus,
} from './persistEvents';

export function startCasperListener() {
  const ws = createCasperEventStream();
  const restClient = createCasperRestClient();
  const cfg = loadCasperConfig();

  let lastPingTimestamp = Date.now();
  let lastKnownBlockHeight: number | null = null;

  logger.info(
    { chain: 'CASPER' },
    'Starting Casper contract-events WebSocket listener',
  );

  ws.on('open', () => {
    logger.info({ chain: 'CASPER' }, 'Casper WS connected');
  });

  ws.on('error', (err) => {
    logger.error({ chain: 'CASPER', err }, 'Casper WS error');
  });

  // Heartbeat watchdog
  const heartbeatInterval = setInterval(() => {
    if (
      Date.now() - lastPingTimestamp >
      cfg.PING_CHECK_INTERVAL_IN_MILLSECCONDS
    ) {
      logger.error('Casper WS ping timeout; restarting process');
      ws.close();
      process.exit(1); // Let PM2 / Docker restart
    }
  }, cfg.PING_CHECK_INTERVAL_IN_MILLSECCONDS);

  const statusInterval = setInterval(async () => {
    try {
      const height = await fetchLatestCasperBlockHeight(restClient);
      lastKnownBlockHeight = height;
      await updateCasperNetworkStatus(height);
    } catch (err) {
      logger.error(
        { chain: 'CASPER', err },
        'Failed to refresh Casper network status',
      );
    }
  }, cfg.PING_CHECK_INTERVAL_IN_MILLSECCONDS);

  ws.on('close', (code, reason) => {
    logger.warn(
      { chain: 'CASPER', code, reason: reason?.toString() },
      'Casper WS closed',
    );
    clearInterval(heartbeatInterval);
    clearInterval(statusInterval);
    // In production: add reconnect logic with backoff
  });

  ws.on('message', async (data: Buffer) => {
    const raw = data.toString();

    if (raw === 'Ping') {
      lastPingTimestamp = Date.now();
      return;
    }

    try {
      const msg = JSON.parse(raw) as CasperContractEventWSMessage;

      if (msg.action !== 'emitted') return;

      switch (msg.data?.name) {
        case 'LockedCanonical': {
          const ev = normalizeCasperLockedCanonical(msg);

          if (!ev.nonce || !ev.destChainId || !ev.destAddress) {
            throw new Error('LockedCanonical missing required fields');
          }

          const eventId = generateEventIdCore({
            sourceChain: ev.sourceChain,
            txHash: ev.txHash,
            logIndex: ev.logIndex,
            token: ev.token,
            amount: ev.amount,
            nonce: ev.nonce,
            destChainId: ev.destChainId,
            destAddress: ev.destAddress,
          });

          await persistCasperSourceEvent({
            eventId,
            ev,
            blockNumber: lastKnownBlockHeight,
          });

          await enqueueCasperLockedCanonical(eventId);

          logger.info(
            {
              chain: ev.sourceChain,
              eventName: ev.eventName,
              deployHash: ev.txHash,
              eventId,
              token: ev.token,
              sender: ev.sender,
              recipient: ev.recipient,
              amount: ev.amount,
              feeAmount: ev.feeAmount,
              netAmount: ev.netAmount,
              nonce: ev.nonce,
              destChainId: ev.destChainId,
            },
            'Casper LockedCanonical event processed',
          );
          break;
        }

        case 'BurnedWrapped': {
          const ev = normalizeCasperBurnedWrapped(msg);

          if (!ev.nonce || !ev.destChainId || !ev.destAddress) {
            throw new Error('BurnedWrapped missing required fields');
          }

          const eventId = generateEventIdCore({
            sourceChain: ev.sourceChain,
            txHash: ev.txHash,
            logIndex: ev.logIndex,
            token: ev.token,
            amount: ev.amount,
            nonce: ev.nonce,
            destChainId: ev.destChainId,
            destAddress: ev.destAddress,
          });

          await persistCasperSourceEvent({
            eventId,
            ev,
            blockNumber: lastKnownBlockHeight,
          });

          await enqueueCasperBurnedWrapped(eventId);

          logger.info(
            {
              chain: ev.sourceChain,
              eventName: ev.eventName,
              deployHash: ev.txHash,
              eventId,
              token: ev.token,
              sender: ev.sender,
              amount: ev.amount,
              nonce: ev.nonce,
              destChainId: ev.destChainId,
              destAddress: ev.destAddress,
            },
            'Casper BurnedWrapped event processed',
          );
          break;
        }

        case 'MintedWrapped': {
          const ev = normalizeCasperMintedWrapped(msg);

          if (!ev.eventId) {
            throw new Error('MintedWrapped missing eventId');
          }

          await updateCasperDestinationStatus({
            eventId: ev.eventId,
            destinationTxHash: ev.txHash,
            eventName: ev.eventName,
          });

          logger.info(
            {
              chain: ev.sourceChain,
              eventName: ev.eventName,
              deployHash: ev.txHash,
              eventId: ev.eventId,
              token: ev.token,
              recipient: ev.recipient,
              amount: ev.amount,
            },
            'Casper MintedWrapped event recorded',
          );
          break;
        }

        case 'UnlockedCanonical': {
          const ev = normalizeCasperUnlockedCanonical(msg);

          if (!ev.eventId) {
            throw new Error('UnlockedCanonical missing eventId');
          }

          await updateCasperDestinationStatus({
            eventId: ev.eventId,
            destinationTxHash: ev.txHash,
            eventName: ev.eventName,
          });

          logger.info(
            {
              chain: ev.sourceChain,
              eventName: ev.eventName,
              deployHash: ev.txHash,
              eventId: ev.eventId,
              token: ev.token,
              recipient: ev.recipient,
              amount: ev.amount,
            },
            'Casper UnlockedCanonical event recorded',
          );
          break;
        }

        default:
          logger.debug(
            {
              chain: 'CASPER',
              eventName: msg.data?.name,
            },
            'Ignoring non-bridge Casper event',
          );
      }
    } catch (err) {
      logger.error(
        { chain: 'CASPER', err },
        'Failed to parse/handle Casper WS message',
      );
    }
  });

  return ws;
}
