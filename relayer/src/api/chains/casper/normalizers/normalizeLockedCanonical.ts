import { BRIDGE_EVENT } from '@prisma/client';
import { NormalizedBridgeEvent } from '../../../lib/utils/normalizedBridgeEvent';
import { CasperContractEventWSMessage } from '../types';
import { CasperLockedCanonicalPayload } from '../types';
import { normalizeCasperTxHash } from './utils';

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
  const amount = payload.amount.toString();
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
    recipient: payload.recipient,

    amount,
    feeAmount,
    netAmount: amount,

    nonce: payload.nonce.toString(),
    destChainId: payload.destination_chain.toString(),
    destAddress: payload.recipient,
  };
}
