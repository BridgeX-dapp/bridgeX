import { logger } from '../../lib/utils/logger';
import { createCasperEventStream } from './provider';
import { CasperContractEventWSMessage } from './types';
import { normalizeCasperLockedCanonical } from './normalizers/normalizeLockedCanonical';
import { loadCasperConfig } from './config';

export function startCasperListener() {
  const ws = createCasperEventStream();
  const cfg = loadCasperConfig();

  logger.info(
    { chain: 'CASPER' },
    'Starting Casper contract-events WebSocket listener',
  );

  ws.on('open', () => {
    logger.info({ chain: 'CASPER' }, '✅ Casper WS connected');
  });

  ws.on('error', (err) => {
    logger.error({ chain: 'CASPER', err }, '❌ Casper WS error');
  });

  ws.on('close', (code, reason) => {
    logger.warn(
      { chain: 'CASPER', code, reason: reason?.toString() },
      '⚠️ Casper WS closed',
    );
    // In production: add reconnect logic with backoff (we’ll do in later block)
  });

  let lastPingTimestamp = Date.now();

  // 🔁 Heartbeat watchdog
  const heartbeatInterval = setInterval(() => {
    if (
      Date.now() - lastPingTimestamp >
      cfg.PING_CHECK_INTERVAL_IN_MILLSECCONDS
    ) {
      logger.error('❌ Casper WS ping timeout — restarting process');
      ws.close();
      process.exit(1); // Let PM2 / Docker restart
    }
  }, cfg.PING_CHECK_INTERVAL_IN_MILLSECCONDS);

  ws.on('message', async (data: Buffer) => {
    const raw = data.toString();
    // 🫀 Ping handling
    if (raw === 'Ping') {
      lastPingTimestamp = Date.now();
      return;
    }
    try {
      const msg = JSON.parse(raw) as CasperContractEventWSMessage;

      // Only care about emitted events
      if (msg.action !== 'emitted') return;

      // Only handle LockedCanonical for now (same as EVM phase)
      if (msg.data?.name !== 'LockedCanonical') return;

      const ev = normalizeCasperLockedCanonical(msg);

      logger.info(
        {
          chain: ev.sourceChain,
          eventName: ev.eventName,
          deployHash: ev.txHash,
          eventId: msg.extra.event_id,
          token: ev.token,
          sender: ev.sender,
          recipient: ev.recipient,
          amount: ev.amount,
          feeAmount: ev.feeAmount,
          netAmount: ev.netAmount,
          nonce: ev.nonce,
          destChainId: ev.destChainId,
        },
        '🔔 Casper LockedCanonical event received',
      );

      // 👉 Next blocks (C5):
      // - generate eventId
      // - persist to DB (idempotent)
      // - enqueue BullMQ job
    } catch (err) {
      logger.error(
        { chain: 'CASPER', err },
        'Failed to parse/handle Casper WS message',
      );
    }
  });

  return ws;
}
