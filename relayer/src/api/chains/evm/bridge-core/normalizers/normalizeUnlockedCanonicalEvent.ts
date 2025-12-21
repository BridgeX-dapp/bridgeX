import { BRIDGE_EVENT } from '@prisma/client';
import { Event } from 'ethers';
import { NormalizedBridgeEvent } from '../../../../lib/utils/normalizedBridgeEvent';

export function normalizeUnlockedCanonical(ev: Event): NormalizedBridgeEvent {
  const { token, recipient, amount, eventId } = ev.args!;

  return {
    sourceChain: 'EVM',
    eventName: BRIDGE_EVENT.UNLOCKED_CANONICAL,

    txHash: ev.transactionHash,
    logIndex: ev.logIndex,
    blockNumber: ev.blockNumber,

    token,
    recipient,
    amount: amount.toString(),

    eventId: eventId.toString(),
  };
}

