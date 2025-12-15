import { BRIDGE_EVENT } from '@prisma/client';
import { PROTOCOL_VERSION } from '../../config/constants';
import prisma from '../../lib/utils/clients/prisma-client';
import { generateEventId } from '../../lib/utils/eventId';
import { NormalizedLockedEvent } from './normalizeLockedCanonicalEvent';

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

  await prisma.transaction.upsert({
    where: { eventId },
    update: {}, // idempotent — no overwrite
    create: {
      eventId,

      sourceChain: ev.sourceChain,
      eventName: ev.eventName,

      sourceTxHash: ev.txHash,
      sourceLogIndex: ev.logIndex,
      blockNumber: BigInt(ev.blockNumber),

      token: ev.token,
      sender: ev.sender,
      amount: ev.amount,
      netAmount: ev.netAmount,
      feeAmount: ev.feeAmount,
      nonce: ev.nonce,

      destChainId: ev.destChainId,
      destAddress: ev.destAddress,

      status: 'LOCKED',
    },
  });

  return eventId;
}
