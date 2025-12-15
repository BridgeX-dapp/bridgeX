import { BRIDGE_EVENT } from '@prisma/client';
import { BigNumber, Event } from 'ethers';

export interface NormalizedLockedEvent {
  sourceChain: 'EVM';
  eventName: BRIDGE_EVENT; //'LockedCanonical';

  txHash: string;
  logIndex: number;
  blockNumber: number;

  token: string;
  sender: string;
  amount: string;
  netAmount: string;
  feeAmount: string;
  nonce: string;

  destChainId: string;
  destAddress: string;
}

export function normalizeLockedCanonical(ev: Event): NormalizedLockedEvent {
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
