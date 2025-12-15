import { BridgeJobType } from '../types';
import { bridgeQueue } from './queue';

export async function enqueueLockedCanonical(eventId: string) {
  await bridgeQueue.add(
    BridgeJobType.PROCESS_LOCKED_CANONICAL,
    { eventId },
    {
      jobId: eventId, // 🔑 idempotency
    },
  );
}
