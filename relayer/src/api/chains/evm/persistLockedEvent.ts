import { BRIDGE_EVENT, CHAIN } from '@prisma/client';
import { PROTOCOL_VERSION } from '../../config/constants';
import prisma from '../../lib/utils/clients/prisma-client';
import { generateEventId } from '../../lib/utils/eventId';
import { NormalizedLockedEvent } from './bridge-core/normalizers/normalizeLockedCanonicalEvent';
import { logger } from '../../lib/utils/logger';
import { resolveChainRefId } from '../../lib/utils/chainResolver';
import { loadEvmConfig } from './config';

export async function persistLockedCanonicalEvent(ev: NormalizedLockedEvent) {
  const evmConfig = loadEvmConfig();
  const eventId = generateEventId({
    sourceChain: ev.sourceChain,
    txHash: ev.txHash,
    logIndex: ev.logIndex,
    token: ev.token,
    amount: ev.amount,
    nonce: ev.nonce,
    destChainId: ev.destChainId,
    destAddress: ev.destAddress,
  });

  const destChainIdNum =
    ev.destChainId && Number.isFinite(Number(ev.destChainId))
      ? Number(ev.destChainId)
      : null;
  const sourceChainRefId = await resolveChainRefId({
    kind: CHAIN.EVM,
    chainId: evmConfig.EVM_CHAIN_ID,
  });
  const destChainRefId = destChainIdNum
    ? await resolveChainRefId({ chainId: destChainIdNum })
    : null;

  try {
    await prisma.transaction.upsert({
      where: { eventId },
      update: {}, // idempotent ƒ?" no overwrite
      create: {
        eventId,

        sourceChain: ev.sourceChain,
        eventName: ev.eventName,

        sourceTxHash: ev.txHash,
        sourceLogIndex: ev.logIndex,
        sourceBlockNumber: BigInt(ev.blockNumber),

        token: ev.token,
        sender: ev.sender,
        amount: ev.amount,
        netAmount: ev.netAmount,
        feeAmount: ev.feeAmount,
        nonce: ev.nonce ? BigInt(ev.nonce) : null,

        destChainId: ev.destChainId,
        destAddress: ev.destAddress,

        sourceChainRefId,
        destChainRefId,

        status: 'LOCKED',
      },
    });
  } catch (error) {
    logger.error(
      {
        source: 'Persist LocketCanonical event',
        action: 'PERSIST_AND_ADVANCE',
        eventName: 'LockedCanonical',
        errorMessage: (error as any)?.message,
        errorStack: (error as any)?.stack,
        errorName: (error as any)?.name,
        rawError: error,
      },
      'Failed to persist LockedCanonical event',
    );
  }

  return eventId;
}
