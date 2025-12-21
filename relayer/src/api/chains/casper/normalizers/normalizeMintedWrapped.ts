import { BRIDGE_EVENT } from '@prisma/client';
import { NormalizedBridgeEvent } from '../../../lib/utils/normalizedBridgeEvent';
import { CasperContractEventWSMessage } from '../types';
import { normalizeCasperEventId, normalizeCasperTxHash } from './utils';

export interface CasperMintedWrappedPayload {
  token: string;
  recipient: string;
  amount: string;
  source_chain: number;
  event_id: string | number[] | Uint8Array;
}

export function normalizeCasperMintedWrapped(
  msg: CasperContractEventWSMessage,
): NormalizedBridgeEvent {
  if (msg.data.name !== 'MintedWrapped') {
    throw new Error('Not a MintedWrapped event');
  }

  const payload = msg.data.data as CasperMintedWrappedPayload;

  return {
    sourceChain: 'CASPER',
    eventName: BRIDGE_EVENT.MINTED_WRAPPED,

    txHash: normalizeCasperTxHash(msg.extra.deploy_hash),
    logIndex: msg.extra.event_id,

    token: payload.token,
    recipient: payload.recipient,
    amount: payload.amount.toString(),

    sourceChainId: payload.source_chain.toString(),
    eventId: normalizeCasperEventId(payload.event_id),
  };
}
