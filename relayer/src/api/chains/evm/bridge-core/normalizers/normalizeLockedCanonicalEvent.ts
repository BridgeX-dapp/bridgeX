import { BRIDGE_EVENT } from '@prisma/client';
import { Event } from 'ethers';
import { NormalizedBridgeEvent } from '../../../../lib/utils/normalizedBridgeEvent';

export type NormalizedLockedEvent = NormalizedBridgeEvent;

export function normalizeLockedCanonical(ev: Event): NormalizedBridgeEvent {
  const {
    token,
    sender,
    grossAmount,
    netAmount,
    feeAmount,
    nonce,
    destChainId,
    destAddress,
  } = ev.args!;

  return {
    sourceChain: 'EVM',
    eventName: BRIDGE_EVENT.LOCKED_CANONICAL, //'LockedCanonical',

    txHash: ev.transactionHash,
    logIndex: ev.logIndex,
    blockNumber: ev.blockNumber,

    token,
    sender,
    amount: grossAmount.toString(),
    netAmount: netAmount.toString(),
    feeAmount: feeAmount.toString(),
    nonce: nonce.toString(),

    destChainId: destChainId.toString(),
    destAddress,
  };
}
