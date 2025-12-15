import prisma from '../../lib/utils/clients/prisma-client';
import { logger } from '../../lib/utils/logger';

export async function handleLockedCanonical(eventId: string) {
  const start = Date.now();

  logger.info(
    {
      eventId,
      stage: 'WORKER_START',
    },
    '🚀 Processing LockedCanonical job',
  );

  try {
    const tx = await prisma.transaction.findUnique({
      where: { eventId },
    });

    if (!tx) {
      logger.warn(
        {
          eventId,
          stage: 'DB_LOOKUP',
        },
        '⚠️ Transaction not found in DB — skipping',
      );
      return;
    }

    logger.info(
      {
        eventId,
        sourceChain: tx.sourceChain,
        destinationChain: tx.destChainId,
        token: tx.token,
        sender: tx.sender,
        recipient: tx.destAddress,
        amount: tx.amount,
        nonce: tx.nonce,
        blockNumber: tx.sourceBlockNumber.toString(),
        sourceTxHash: tx.sourceTxHash,
      },
      '📦 Loaded LockedCanonical transaction from DB',
    );

    // 👇 later: submit mint/unlock tx here

    await prisma.transaction.update({
      where: { eventId },
      data: {
        status: 'EXECUTED',
      },
    });

    logger.info(
      {
        eventId,
        status: 'EXCUTED',
        durationMs: Date.now() - start,
      },
      '✅ LockedCanonical job processed successfully',
    );
  } catch (error: any) {
    logger.error(
      {
        eventId,
        stage: 'WORKER_ERROR',
        message: error?.message,
        stack: error?.stack,
      },
      '❌ Failed to process LockedCanonical job',
    );

    throw error; // important so BullMQ can retry
  }
}
