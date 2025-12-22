import prisma from '../../lib/utils/clients/prisma-client';
import { logger } from '../../lib/utils/logger';
import { unlockFromBurnOnEvm } from '../../chains/evm/bridge-core/unlockFromBurn';
import { resolveDestinationToken } from '../../lib/utils/tokenMapping';

function bytes32ToEvmAddress(value: string) {
  const clean = value.startsWith('0x') ? value.slice(2) : value;
  if (clean.length !== 64) {
    throw new Error('destRecipient must be 32 bytes hex');
  }
  return `0x${clean.slice(24)}`; // last 20 bytes
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

    const recipient = bytes32ToEvmAddress(tx.destAddress);

    const { destToken, destChain } = await resolveDestinationToken(tx);
    if (destChain.kind !== 'EVM') {
      throw new Error('destination chain is not EVM');
    }
    if (!destToken.contractAddress) {
      throw new Error('destination token missing contractAddress');
    }
    await prisma.transaction.update({
      where: { eventId },
      data: { status: 'EXECUTING' },
    });

    const { txHash } = await unlockFromBurnOnEvm({
      token: destToken.contractAddress,
      recipient,
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
