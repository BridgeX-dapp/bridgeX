import prisma from '../../lib/utils/clients/prisma-client';
import { logger } from '../../lib/utils/logger';
import { unlockCanonicalOnCasper } from '../../chains/casper/bridge-core/unlokCanonical';
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

export async function handleEvmBurnedWrapped(eventId: string) {
  const start = Date.now();
  const evmConfig = loadEvmConfig();

  logger.info(
    {
      eventId,
      stage: 'WORKER_START',
    },
    'Processing EVM BurnedWrapped job',
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

    const { deployHash } = await unlockCanonicalOnCasper({
      token: destToken.contractPackageHash,
      recipient: tx.destAddress,
      amount: tx.amount,
      sourceChain: evmConfig.EVM_CHAIN_ID,
      eventId: normalizeCasperHex32(eventId),
    });

    await prisma.transaction.update({
      where: { eventId },
      data: {
        status: 'EXECUTED',
        destinationTxHash: deployHash.toHex(),
      },
    });

    logger.info(
      {
        eventId,
        status: 'EXECUTED',
        destinationTxHash: deployHash,
        durationMs: Date.now() - start,
      },
      'EVM BurnedWrapped job processed successfully',
    );
  } catch (error: any) {
    logger.error(
      {
        eventId,
        stage: 'WORKER_ERROR',
        message: error?.message,
        stack: error?.stack,
      },
      'Failed to process EVM BurnedWrapped job',
    );

    throw error;
  }
}
