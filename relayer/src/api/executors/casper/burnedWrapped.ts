import prisma from '../../lib/utils/clients/prisma-client';
import { logger } from '../../lib/utils/logger';
import { unlockFromBurnOnEvm } from '../../chains/evm/bridge-core/unlockFromBurn';

function assertEvmAddress(label: string, value: string) {
  if (!value?.startsWith('0x')) {
    throw new Error(`${label} must be an EVM address (0x...)`);
  }
}

export async function handleCasperBurnedWrapped(eventId: string) {
  const start = Date.now();

  logger.info(
    {
      eventId,
      stage: 'WORKER_START',
    },
    'Processing Casper BurnedWrapped job',
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
        'Transaction not found in DB; skipping',
      );
      return;
    }

    if (!tx.destAddress) {
      throw new Error('destAddress missing on transaction');
    }

    assertEvmAddress('token', tx.token);
    assertEvmAddress('destAddress', tx.destAddress);

    await prisma.transaction.update({
      where: { eventId },
      data: { status: 'EXECUTING' },
    });

    const { txHash } = await unlockFromBurnOnEvm({
      token: tx.token,
      recipient: tx.destAddress,
      amount: tx.amount,
      eventId,
    });

    await prisma.transaction.update({
      where: { eventId },
      data: {
        status: 'EXECUTED',
        destinationTxHash: txHash,
      },
    });

    logger.info(
      {
        eventId,
        status: 'EXECUTED',
        destinationTxHash: txHash,
        durationMs: Date.now() - start,
      },
      'Casper BurnedWrapped job processed successfully',
    );
  } catch (error: any) {
    logger.error(
      {
        eventId,
        stage: 'WORKER_ERROR',
        message: error?.message,
        stack: error?.stack,
      },
      'Failed to process Casper BurnedWrapped job',
    );

    throw error;
  }
}
