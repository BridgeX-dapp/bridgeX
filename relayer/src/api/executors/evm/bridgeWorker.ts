import { Worker } from 'bullmq';
import { logger } from '../../lib/utils/logger';
import { BridgeJobType } from '../../lib/utils/jobs/types';
import { redisConnection } from '../../bullmq-demo/redis';
import { handleLockedCanonical } from './lockedCanonical';

export function startBridgeWorker() {
  new Worker(
    'bridge-jobs',
    async (job) => {
      logger.info({ jobId: job.id, type: job.name }, 'Processing bridge job');

      switch (job.name) {
        case BridgeJobType.PROCESS_LOCKED_CANONICAL:
          await handleLockedCanonical(job.data.eventId);
          break;

        default:
          throw new Error(`Unknown job type ${job.name}`);
      }
    },
    {
      connection: redisConnection,
      concurrency: 1, // 🔒 serialized execution
    },
  );
}
