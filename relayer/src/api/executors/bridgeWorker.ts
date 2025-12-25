import { Worker } from 'bullmq';
import { logger } from '../lib/utils/logger';
import { BridgeJobType } from '../lib/utils/jobs/types';
import { redisConnection } from '../bullmq-demo/redis';
import { bridgeQueue } from '../lib/utils/jobs/queue/queue';
import { handleLockedCanonical } from './evm/lockedCanonical';
import { handleEvmBurnedWrapped } from './evm/burnedWrapped';
import { handleCasperLockedCanonical } from './casper/lockedCanonical';
import { handleCasperBurnedWrapped } from './casper/burnedWrapped';

const IDLE_CHECK_INTERVAL_MS = Number(
  process.env.QUEUE_IDLE_CHECK_INTERVAL_MS ?? 60_000,
);
const IDLE_GRACE_COUNT = Number(
  process.env.QUEUE_IDLE_GRACE_COUNT ?? 3,
);

export function startBridgeWorker() {
  const worker = new Worker(
    'bridge-jobs',
    async (job) => {
      logger.info({ jobId: job.id, type: job.name }, 'Processing bridge job');

      switch (job.name) {
        case BridgeJobType.PROCESS_LOCKED_CANONICAL:
          await handleLockedCanonical(job.data.eventId);
          break;

        case BridgeJobType.PROCESS_EVM_BURNED_WRAPPED:
          await handleEvmBurnedWrapped(job.data.eventId);
          break;

        case BridgeJobType.PROCESS_CASPER_LOCKED_CANONICAL:
          await handleCasperLockedCanonical(job.data.eventId);
          break;

        case BridgeJobType.PROCESS_CASPER_BURNED_WRAPPED:
          await handleCasperBurnedWrapped(job.data.eventId);
          break;

        default:
          throw new Error(`Unknown job type ${job.name}`);
      }
    },
    {
      connection: redisConnection,
      concurrency: 1, // serialized execution
      lockRenewTime: 60_000,
      stalledInterval: 60_000,
    },
  );

  let idleChecks = 0;
  let isPaused = false;

  setInterval(async () => {
    try {
      const counts = await bridgeQueue.getJobCounts(
        'waiting',
        'active',
        'delayed',
      );

      const isIdle =
        counts.waiting === 0 &&
        counts.active === 0 &&
        counts.delayed === 0;

      if (isIdle) {
        idleChecks += 1;
      } else {
        idleChecks = 0;
        if (isPaused) {
          await worker.resume();
          isPaused = false;
          logger.info('Bridge worker resumed');
        }
      }

      if (!isPaused && idleChecks >= IDLE_GRACE_COUNT) {
        await worker.pause();
        isPaused = true;
        logger.info(
          { idleChecks },
          'Bridge worker paused due to idle queue',
        );
      }
    } catch (error) {
      logger.error({ error }, 'Failed to evaluate queue idle state');
    }
  }, IDLE_CHECK_INTERVAL_MS);
}
