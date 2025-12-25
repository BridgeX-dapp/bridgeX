import prisma from '../../lib/utils/clients/prisma-client';
import { logger } from '../../lib/utils/logger';
import { mintWrappedOnCasper } from '../../chains/casper/bridge-core/mintWrapped';
import { loadEvmConfig } from '../../chains/evm/config';
import { resolveDestinationToken } from '../../lib/utils/tokenMapping';

function normalizeCasperHex32(value: string) {
  return value.startsWith('0x') ? value.slice(2) : value;
}

function assertBytes32Hex(value: string) {
  const clean = value.startsWith('0x') ? value.slice(2) : value;
  if (!/^[0-9a-fA-F]{64}$/.test(clean)) {
    throw new Error('destAddress must be 32 bytes hex');
  }
}

export async function handleLockedCanonical(eventId: string) {
  const start = Date.now();
  const evmConfig = loadEvmConfig();

  logger.info(
    {
      eventId,
      stage: 'WORKER_START',
    },
    'Processing LockedCanonical job',
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
    assertBytes32Hex(tx.destAddress);

    const amount = tx.netAmount ?? tx.amount;

    const { destToken, destChain } = await resolveDestinationToken(tx);
    if (destChain.kind !== 'CASPER') {
      throw new Error('destination chain is not CASPER');
    }
    if (!destToken.contractPackageHash) {
      throw new Error('destination token missing contractPackageHash');
    }

    await prisma.transaction.update({
      where: { eventId },
      data: { status: 'EXECUTING' },
    });

    const { deployHash } = await mintWrappedOnCasper({
      token: destToken.contractPackageHash,
      recipient: tx.destAddress,
      amount,
      sourceChain: evmConfig.EVM_CHAIN_ID,
      eventId: normalizeCasperHex32(eventId),
    });

    await prisma.transaction.update({
      where: { eventId },
      data: {
        status: 'EXECUTING',
        destinationTxHash: deployHash.toHex(),
      },
    });

    logger.info(
      {
        eventId,
        status: 'EXECUTING',
        destinationTxHash: deployHash,
        durationMs: Date.now() - start,
      },
      'LockedCanonical job submitted',
    );
  } catch (error: any) {
    logger.error(
      {
        eventId,
        stage: 'WORKER_ERROR',
        message: error?.message,
        stack: error?.stack,
      },
      'Failed to process LockedCanonical job',
    );

    throw error; // important so BullMQ can retry
  }
}
