import { Server } from 'socket.io';
import { Prisma } from '@prisma/client';
import prisma from '../lib/utils/clients/prisma-client';
import { logger } from '../lib/utils/logger';

const POLL_INTERVAL_MS = 2000;
const SNAPSHOT_LIMIT = 50;

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

  const poller = setInterval(async () => {
    try {
      const updated = await prisma.transaction.findMany({
        where: { updatedAt: { gt: lastSeen } },
        orderBy: { updatedAt: 'asc' },
        take: 100,
        include: {
          sourceChainRef: true,
          destChainRef: true,
          tokenRef: true,
        },
      });

      if (updated.length === 0) return;

      lastSeen = updated[updated.length - 1].updatedAt;

      io.emit(
        'transactions:update',
        updated.map(serializeTransaction),
      );
    } catch (err) {
      logger.error({ err }, 'Failed to poll transaction updates');
    }
  }, POLL_INTERVAL_MS);

  io.on('connection', async (socket) => {
    logger.info({ socketId: socket.id }, 'Socket connected');

    try {
      const recent = await prisma.transaction.findMany({
        orderBy: { updatedAt: 'desc' },
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
