import { BRIDGE_EVENT } from '@prisma/client';
import { Event } from 'ethers';
import { NormalizedBridgeEvent } from '../../../../lib/utils/normalizedBridgeEvent';

export function normalizeMintedWrapped(ev: Event): NormalizedBridgeEvent {
  const { wrappedToken, recipient, amount, eventId } = ev.args!;

  return {
    sourceChain: 'EVM',
    eventName: BRIDGE_EVENT.MINTED_WRAPPED,

    txHash: ev.transactionHash,
    logIndex: ev.logIndex,
    blockNumber: ev.blockNumber,

    token: wrappedToken,
    recipient,
    amount: amount.toString(),

    eventId: eventId.toString(),
  };
}

