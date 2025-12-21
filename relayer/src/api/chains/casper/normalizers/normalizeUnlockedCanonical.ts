import { BRIDGE_EVENT } from '@prisma/client';
import { NormalizedBridgeEvent } from '../../../lib/utils/normalizedBridgeEvent';
import { CasperContractEventWSMessage } from '../types';
import { normalizeCasperEventId, normalizeCasperTxHash } from './utils';

export interface CasperUnlockedCanonicalPayload {
  token: string;
  recipient: string;
  amount: string;
  source_chain: number;
  event_id: string | number[] | Uint8Array;
}

export function normalizeCasperUnlockedCanonical(
  msg: CasperContractEventWSMessage,
): NormalizedBridgeEvent {
  if (msg.data.name !== 'UnlockedCanonical') {
    throw new Error('Not a UnlockedCanonical event');
  }

  const payload = msg.data.data as CasperUnlockedCanonicalPayload;

  return {
    sourceChain: 'CASPER',
    eventName: BRIDGE_EVENT.UNLOCKED_CANONICAL,

    txHash: normalizeCasperTxHash(msg.extra.deploy_hash),
    logIndex: msg.extra.event_id,

    token: payload.token,
    recipient: payload.recipient,
    amount: payload.amount.toString(),

    sourceChainId: payload.source_chain.toString(),
    eventId: normalizeCasperEventId(payload.event_id),
  };
}
