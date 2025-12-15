import { BRIDGE_EVENT } from '@prisma/client';
import { PROTOCOL_VERSION } from '../../config/constants';
import prisma from '../../lib/utils/clients/prisma-client';
import { generateEventId } from '../../lib/utils/eventId';
import { NormalizedLockedEvent } from './normalizeLockedCanonicalEvent';
import { logger } from '../../lib/utils/logger';

export async function persistLockedCanonicalEvent(ev: NormalizedLockedEvent) {
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

  try {
    await prisma.transaction.upsert({
      where: { eventId },
      update: {}, // idempotent — no overwrite
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

        status: 'LOCKED',
      },
    });
  } catch (error) {
    logger.error(
      {
        source: 'Persist LocketCanonical event',
        action: 'PERSIST_AND_ADVANCE',
        eventName: 'LockedCanonical',
        errorMessage: error?.message,
        errorStack: error?.stack,
        errorName: error?.name,
        rawError: error,
      },
      'Failed to persist LockedCanonical event',
    );
  }

  return eventId;
}
