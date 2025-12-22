import { BRIDGE_EVENT } from '@prisma/client';
import { NormalizedBridgeEvent } from '../../../lib/utils/normalizedBridgeEvent';
import { CasperContractEventWSMessage } from '../types';
import { CasperLockedCanonicalPayload } from '../types';
import {
  normalizeCasperRecipientBytes32,
  normalizeCasperTxHash,
} from './utils';

/**
 * Normalized Casper LockedCanonical event
 * Mirrors EVM NormalizedLockedEvent shape
 */
export type NormalizedCasperLockedCanonicalEvent = NormalizedBridgeEvent;

export function normalizeCasperLockedCanonical(
  msg: CasperContractEventWSMessage,
): NormalizedBridgeEvent {
  // 1️⃣ Type guard
  if (msg.data.name !== 'LockedCanonical') {
    throw new Error('Not a LockedCanonical event');
  }

  const payload = msg.data.data as CasperLockedCanonicalPayload;

  // 2️⃣ Compute amounts
  if (!payload.gross_amount && !payload.amount) {
    throw new Error('LockedCanonical missing gross/amount');
  }
  const amount = payload.gross_amount
    ? payload.gross_amount.toString()
    : payload.amount.toString();
  const netAmount = payload.net_amount
    ? payload.net_amount.toString()
    : payload.amount.toString();
  const feeAmount = payload.fee.toString();

  // 3️⃣ Normalize deploy hash (bytes32-compatible)
  const txHash = normalizeCasperTxHash(msg.extra.deploy_hash);

  return {
    sourceChain: 'CASPER',
    eventName: BRIDGE_EVENT.LOCKED_CANONICAL,

    txHash,
    logIndex: msg.extra.event_id,

    token: payload.token,
    sender: payload.sender,
    recipient: normalizeCasperRecipientBytes32(payload.recipient),

    amount,
    feeAmount,
    netAmount,

    nonce: payload.nonce.toString(),
    destChainId: payload.destination_chain.toString(),
    destAddress: normalizeCasperRecipientBytes32(payload.recipient),
  };
}
