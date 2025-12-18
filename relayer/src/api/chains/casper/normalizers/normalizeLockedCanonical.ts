import { BRIDGE_EVENT } from '@prisma/client';
import { CasperContractEventWSMessage } from '../types';
import { CasperLockedCanonicalPayload } from '../types';

/**
 * Normalized Casper LockedCanonical event
 * Mirrors EVM NormalizedLockedEvent shape
 */
export interface NormalizedCasperLockedCanonicalEvent {
  sourceChain: 'CASPER';
  eventName: BRIDGE_EVENT;

  txHash: string; // deploy_hash
  logIndex: number; // event_id

  token: string;
  sender: string;
  recipient: string;

  amount: string;
  feeAmount: string;
  netAmount: string;

  nonce: string;
  destChainId: string;
  destAddress: string;
}

export function normalizeCasperLockedCanonical(
  msg: CasperContractEventWSMessage,
): NormalizedCasperLockedCanonicalEvent {
  // 1️⃣ Type guard
  if (msg.data.name !== 'LockedCanonical') {
    throw new Error('Not a LockedCanonical event');
  }

  const payload = msg.data.data as CasperLockedCanonicalPayload;

  // 2️⃣ Compute amounts
  const amount = payload.amount.toString();
  const feeAmount = payload.fee.toString();
  const netAmount = (BigInt(amount) - BigInt(feeAmount)).toString();

  // 3️⃣ Normalize deploy hash (bytes32-compatible)
  const txHash = msg.extra.deploy_hash.startsWith('0x')
    ? msg.extra.deploy_hash
    : `0x${msg.extra.deploy_hash}`;

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
    netAmount,

    nonce: payload.nonce.toString(),
    destChainId: payload.destination_chain.toString(),
    destAddress: payload.recipient,
  };
}
