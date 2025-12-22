import { BRIDGE_EVENT, CHAIN } from '@prisma/client';
import prisma from '../../lib/utils/clients/prisma-client';
import { NormalizedBridgeEvent } from '../../lib/utils/normalizedBridgeEvent';
import { logger } from '../../lib/utils/logger';
import { resolveChainRefId } from '../../lib/utils/chainResolver';
import { loadEvmConfig } from './config';

function getStatusForSourceEvent(eventName: BRIDGE_EVENT) {
  switch (eventName) {
    case BRIDGE_EVENT.LOCKED_CANONICAL:
      return 'LOCKED';
    case BRIDGE_EVENT.BURNED_WRAPPED:
      return 'BURNED';
    default:
      throw new Error(`Unsupported source event ${eventName}`);
  }
}

export async function persistEvmSourceEvent(params: {
  eventId: string;
  ev: NormalizedBridgeEvent;
}) {
  const { eventId, ev } = params;
  const evmConfig = loadEvmConfig();

  if (ev.blockNumber === undefined) {
    throw new Error('blockNumber is required for EVM events');
  }

  const status = getStatusForSourceEvent(ev.eventName);
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
      update: {},
      create: {
        eventId,

        sourceChain: ev.sourceChain,
        eventName: ev.eventName,

        sourceTxHash: ev.txHash,
        sourceLogIndex: ev.logIndex,
        sourceBlockNumber: BigInt(ev.blockNumber),

        token: ev.token,
        sender: ev.sender ?? '',
        amount: ev.amount,
        netAmount: ev.netAmount ?? ev.amount,
        feeAmount: ev.feeAmount ?? '0',
        nonce: ev.nonce ? BigInt(ev.nonce) : null,

        destChainId: ev.destChainId ?? '',
        destAddress: ev.destAddress ?? '',

        sourceChainRefId,
        destChainRefId,

        status,
      },
    });
  } catch (error) {
    logger.error(
      {
        source: 'Persist EVM source event',
        eventName: ev.eventName,
        eventId,
        txHash: ev.txHash,
        errorMessage: (error as any)?.message,
        errorStack: (error as any)?.stack,
        errorName: (error as any)?.name,
      },
      'Failed to persist EVM source event',
    );
    throw error;
  }

  return eventId;
}

export async function updateEvmDestinationStatus(params: {
  eventId: string;
  destinationTxHash: string;
  eventName: BRIDGE_EVENT;
}) {
  const { eventId, destinationTxHash, eventName } = params;

  const tx = await prisma.transaction.findUnique({
    where: { eventId },
  });

  if (!tx) {
    logger.warn(
      { eventId, eventName },
      'EVM destination event received but transaction not found',
    );
    return null;
  }

  await prisma.transaction.update({
    where: { eventId },
    data: {
      destinationTxHash,
      status: 'EXECUTED',
    },
  });

  return eventId;
}
