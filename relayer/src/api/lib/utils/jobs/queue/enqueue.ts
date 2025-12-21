import { BridgeJobType } from '../types';
import { bridgeQueue } from './queue';

export async function enqueueLockedCanonical(eventId: string) {
  await bridgeQueue.add(
    BridgeJobType.PROCESS_LOCKED_CANONICAL,
    { eventId },
    {
      jobId: eventId, // dY"` idempotency
    },
  );
}

export async function enqueueCasperLockedCanonical(eventId: string) {
  await bridgeQueue.add(
    BridgeJobType.PROCESS_CASPER_LOCKED_CANONICAL,
    { eventId },
    {
      jobId: eventId,
    },
  );
}

export async function enqueueCasperBurnedWrapped(eventId: string) {
  await bridgeQueue.add(
    BridgeJobType.PROCESS_CASPER_BURNED_WRAPPED,
    { eventId },
    {
      jobId: eventId,
    },
  );
}
