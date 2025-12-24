import prisma from '../../lib/utils/clients/prisma-client';
import { logger } from '../../lib/utils/logger';
import { mintFromLockOnEvm } from '../../chains/evm/bridge-core/mintFromLock';
import { resolveDestinationToken } from '../../lib/utils/tokenMapping';
import { resolveEvmChainConfig } from '../../chains/evm/config';

function bytes32ToEvmAddress(value: string) {
  const clean = value.startsWith('0x') ? value.slice(2) : value;
  if (clean.length !== 64) {
    throw new Error('destRecipient must be 32 bytes hex');
  }
  return `0x${clean.slice(24)}`; // last 20 bytes
}

export async function handleCasperLockedCanonical(eventId: string) {
  const start = Date.now();

  logger.info(
    {
      eventId,
      stage: 'WORKER_START',
    },
    'Processing Casper LockedCanonical job',
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

    const amount = tx.netAmount ?? tx.amount;
    const recipient = bytes32ToEvmAddress(tx.destAddress);

    const { destToken, destChain } = await resolveDestinationToken(tx);
    if (destChain.kind !== 'EVM') {
      throw new Error('destination chain is not EVM');
    }
    if (!destToken.contractAddress) {
      throw new Error('destination token missing contractAddress');
    }

    const chainConfig = resolveEvmChainConfig(destChain.name);

    await prisma.transaction.update({
      where: { eventId },
      data: { status: 'EXECUTING' },
    });

    const { txHash } = await mintFromLockOnEvm({
      wrappedToken: destToken.contractAddress,
      recipient,
      amount,
      eventId,
      chainConfig,
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
      'Casper LockedCanonical job processed successfully',
    );
  } catch (error: any) {
    logger.error(
      {
        eventId,
        stage: 'WORKER_ERROR',
        message: error?.message,
        stack: error?.stack,
      },
      'Failed to process Casper LockedCanonical job',
    );

    throw error;
  }
}
