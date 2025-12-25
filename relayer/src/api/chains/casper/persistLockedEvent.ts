import { CHAIN } from '@prisma/client';
import prisma from '../../lib/utils/clients/prisma-client';
import { generateEventId } from '../../lib/utils/eventId';
import { logger } from '../../lib/utils/logger';
import { resolveChainRefId } from '../../lib/utils/chainResolver';
import { resolveSourceTokenId } from '../../lib/utils/tokenMapping';
import { NormalizedCasperLockedCanonicalBackfillEvent } from './backFillEvents';

export async function persistCasperLockedCanonicalEvent(
  ev: NormalizedCasperLockedCanonicalBackfillEvent,
) {
  const eventId = generateEventId({
    sourceChain: ev.sourceChain,
    txHash: ev.txHash,
    logIndex: ev.logIndex,
    token: ev.token,
    amount: ev.amount,
    nonce: ev.nonce,
    destChainId: ev.destChainId,
    destAddress: ev.destAddress,
  });

  const destChainIdNum =
    ev.destChainId && Number.isFinite(Number(ev.destChainId))
      ? Number(ev.destChainId)
      : null;
  const sourceChainRefId = await resolveChainRefId({
    kind: CHAIN.CASPER,
  });
  const destChainRefId = destChainIdNum
    ? await resolveChainRefId({ chainId: destChainIdNum })
    : null;

  const tokenRefId = ev.token
    ? await resolveSourceTokenId(sourceChainRefId, ev.token)
    : null;

  try {
    await prisma.transaction.upsert({
      where: { eventId },
      update: {
        tokenRefId: tokenRefId ?? undefined,
        sourceChainRefId,
        destChainRefId,
      }, // idempotent
      create: {
        eventId,

        sourceChain: ev.sourceChain,
        eventName: ev.eventName,

        sourceTxHash: ev.txHash,
        sourceLogIndex: ev.logIndex,
        sourceBlockNumber: BigInt(ev.blockNumber),

        token: ev.token,
        sender: ev.sender,
        amount: ev.amount,
        netAmount: ev.netAmount,
        feeAmount: ev.feeAmount,
        nonce: ev.nonce ? BigInt(ev.nonce) : null,

        destChainId: ev.destChainId,
        destAddress: ev.destAddress,

        sourceChainRefId,
        destChainRefId,
        tokenRefId,

        status: 'LOCKED',
      },
    });
  } catch (error) {
    logger.error(
      {
        source: 'Persist Casper LockedCanonical event',
        eventName: 'LockedCanonical',
        txHash: ev.txHash,
        blockNumber: ev.blockNumber,
        errorMessage: (error as any)?.message,
        errorStack: (error as any)?.stack,
        errorName: (error as any)?.name,
        rawError: error,
      },
      'Failed to persist Casper LockedCanonical event',
    );
    throw error;
  }

  return eventId;
}
