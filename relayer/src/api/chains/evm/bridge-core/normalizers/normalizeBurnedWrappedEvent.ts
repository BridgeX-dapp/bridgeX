import { BRIDGE_EVENT } from '@prisma/client';
import { Event } from 'ethers';
import { NormalizedBridgeEvent } from '../../../../lib/utils/normalizedBridgeEvent';
import { normalizeBytes32 } from '../utils';

export function normalizeBurnedWrapped(ev: Event): NormalizedBridgeEvent {
  const {
    wrappedToken,
    sender,
    grossAmount,
    netAmount,
    feeAmount,
    nonce,
    destChainId,
    destRecipient,
  } = ev.args!;

  return {
    sourceChain: 'EVM',
    eventName: BRIDGE_EVENT.BURNED_WRAPPED,

    txHash: ev.transactionHash,
    logIndex: ev.logIndex,
    blockNumber: ev.blockNumber,

    token: wrappedToken,
    sender,
    amount: grossAmount.toString(),
    netAmount: netAmount.toString(),
    feeAmount: feeAmount.toString(),
    nonce: nonce.toString(),

    destChainId: destChainId.toString(),
    destAddress: normalizeBytes32(destRecipient),
  };
}
