import { BRIDGE_EVENT } from '@prisma/client';
import { NormalizedBridgeEvent } from '../../../lib/utils/normalizedBridgeEvent';
import { CasperContractEventWSMessage } from '../types';
import {
  normalizeCasperRecipientBytes32,
  normalizeCasperTxHash,
} from './utils';

export interface CasperBurnedWrappedPayload {
  token: string;
  sender: string;
  recipient: string | number[] | Uint8Array;
  amount?: string;
  gross_amount?: string;
  net_amount?: string;
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

  if (!payload.gross_amount && !payload.amount) {
    throw new Error('BurnedWrapped missing gross/amount');
  }

  return {
    sourceChain: 'CASPER',
    eventName: BRIDGE_EVENT.BURNED_WRAPPED,

    txHash: normalizeCasperTxHash(msg.extra.deploy_hash),
    logIndex: msg.extra.event_id,

    token: payload.token,
    sender: payload.sender,
    amount: payload.gross_amount
      ? payload.gross_amount.toString()
      : payload.amount.toString(),
    feeAmount: payload.fee.toString(),
    netAmount: payload.net_amount
      ? payload.net_amount.toString()
      : payload.amount.toString(),

    nonce: payload.nonce.toString(),
    destChainId: payload.destination_chain.toString(),
    destAddress: normalizeCasperRecipientBytes32(payload.recipient),
  };
}
