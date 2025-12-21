import { BRIDGE_EVENT } from '@prisma/client';
import prisma from '../../lib/utils/clients/prisma-client';
import { NormalizedBridgeEvent } from '../../lib/utils/normalizedBridgeEvent';
import { logger } from '../../lib/utils/logger';

const DEFAULT_BLOCK_NUMBER = 0;

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

export async function persistCasperSourceEvent(params: {
  eventId: string;
  ev: NormalizedBridgeEvent;
  blockNumber?: number | null;
}) {
  const { eventId, ev } = params;
  const blockNumber = params.blockNumber ?? DEFAULT_BLOCK_NUMBER;

  const status = getStatusForSourceEvent(ev.eventName);

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
        sourceBlockNumber: BigInt(blockNumber),

        token: ev.token,
        sender: ev.sender ?? '',
        amount: ev.amount,
        netAmount: ev.netAmount ?? ev.amount,
        feeAmount: ev.feeAmount ?? '0',
        nonce: ev.nonce ? BigInt(ev.nonce) : null,

        destChainId: ev.destChainId ?? '',
        destAddress: ev.destAddress ?? '',

        status,
      },
    });
  } catch (error) {
    logger.error(
      {
        source: 'Persist Casper source event',
        eventName: ev.eventName,
        eventId,
        txHash: ev.txHash,
        errorMessage: (error as any)?.message,
        errorStack: (error as any)?.stack,
        errorName: (error as any)?.name,
      },
      'Failed to persist Casper source event',
    );
    throw error;
  }

  return eventId;
}

export async function updateCasperDestinationStatus(params: {
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
      'Casper destination event received but transaction not found',
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
