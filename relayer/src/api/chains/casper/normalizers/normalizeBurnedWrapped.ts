import { BRIDGE_EVENT } from '@prisma/client';
import { NormalizedBridgeEvent } from '../../../lib/utils/normalizedBridgeEvent';
import { CasperContractEventWSMessage } from '../types';
import { normalizeCasperTxHash } from './utils';

export interface CasperBurnedWrappedPayload {
  token: string;
  sender: string;
  recipient: string;
  amount: string;
  fee: string;
  destination_chain: number;
  nonce: number;
}

export function normalizeCasperBurnedWrapped(
  msg: CasperContractEventWSMessage,
): NormalizedBridgeEvent {
  if (msg.data.name !== 'BurnedWrapped') {
    throw new Error('Not a BurnedWrapped event');
  }

  const payload = msg.data.data as CasperBurnedWrappedPayload;

  return {
    sourceChain: 'CASPER',
    eventName: BRIDGE_EVENT.BURNED_WRAPPED,

    txHash: normalizeCasperTxHash(msg.extra.deploy_hash),
    logIndex: msg.extra.event_id,

    token: payload.token,
    sender: payload.sender,
    amount: payload.amount.toString(),
    feeAmount: payload.fee.toString(),
    netAmount: payload.amount.toString(),

    nonce: payload.nonce.toString(),
    destChainId: payload.destination_chain.toString(),
    destAddress: payload.recipient,
  };
}

