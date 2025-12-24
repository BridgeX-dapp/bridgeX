import { Server } from 'socket.io';
import { Prisma } from '@prisma/client';
import prisma from '../lib/utils/clients/prisma-client';
import { logger } from '../lib/utils/logger';

const POLL_INTERVAL_MS = Number(process.env.REALTIME_POLL_INTERVAL_MS ?? 3000);
const SNAPSHOT_LIMIT = Number(process.env.REALTIME_SNAPSHOT_LIMIT ?? 30);
const ERROR_BACKOFF_MS = Number(process.env.REALTIME_ERROR_BACKOFF_MS ?? 8000);

type TransactionWithRefs = Prisma.TransactionGetPayload<{
  include: {
    sourceChainRef: true;
    destChainRef: true;
    tokenRef: true;
  };
}>;

function serializeTransaction(tx: TransactionWithRefs) {
  return {
    ...tx,
    sourceBlockNumber: tx.sourceBlockNumber?.toString(),
    destinationBlockNumber: tx.destinationBlockNumber?.toString(),
    nonce: tx.nonce?.toString(),
  };
}

export function startTransactionStream(io: Server) {
  let lastSeen = new Date(0);
  let lastSeenId = 0;
  let backoffUntil = 0;

  const poller = setInterval(async () => {
    if (Date.now() < backoffUntil) return;

    try {
      const updated = await prisma.transaction.findMany({
        where: {
          OR: [
            { updatedAt: { gt: lastSeen } },
            { updatedAt: lastSeen, id: { gt: lastSeenId } },
          ],
        },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
        take: 100,
        include: {
          sourceChainRef: true,
          destChainRef: true,
          tokenRef: true,
        },
      });

      if (updated.length === 0) return;

      const last = updated[updated.length - 1];
      lastSeen = last.updatedAt;
      lastSeenId = last.id;

      io.emit(
        'transactions:update',
        updated.map(serializeTransaction),
      );
    } catch (err) {
      logger.error({ err }, 'Failed to poll transaction updates');
      backoffUntil = Date.now() + ERROR_BACKOFF_MS;
    }
  }, POLL_INTERVAL_MS);

  io.on('connection', async (socket) => {
    logger.info({ socketId: socket.id }, 'Socket connected');

    try {
      const recent = await prisma.transaction.findMany({
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        take: SNAPSHOT_LIMIT,
        include: {
          sourceChainRef: true,
          destChainRef: true,
          tokenRef: true,
        },
      });

      socket.emit(
        'transactions:snapshot',
        recent.map(serializeTransaction),
      );
    } catch (err) {
      logger.error({ err }, 'Failed to load transaction snapshot');
    }

    socket.on('disconnect', () =>
      logger.info({ socketId: socket.id }, 'Socket disconnected'),
    );
  });

  return () => clearInterval(poller);
}
