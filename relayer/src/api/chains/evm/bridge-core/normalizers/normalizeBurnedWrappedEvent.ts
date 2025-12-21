import { BRIDGE_EVENT } from '@prisma/client';
import { Event } from 'ethers';
import { NormalizedBridgeEvent } from '../../../../lib/utils/normalizedBridgeEvent';

export function normalizeBurnedWrapped(ev: Event): NormalizedBridgeEvent {
  const {
    wrappedToken,
    sender,
    amount,
    nonce,
    destChainId,
    destAddress,
  } = ev.args!;

  return {
    sourceChain: 'EVM',
    eventName: BRIDGE_EVENT.BURNED_WRAPPED,

    txHash: ev.transactionHash,
    logIndex: ev.logIndex,
    blockNumber: ev.blockNumber,

    token: wrappedToken,
    sender,
    amount: amount.toString(),
    nonce: nonce.toString(),

    destChainId: destChainId.toString(),
    destAddress,
  };
}

