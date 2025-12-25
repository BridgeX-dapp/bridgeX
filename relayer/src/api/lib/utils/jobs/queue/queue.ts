import { Queue } from 'bullmq';
import { redisConnection } from '../../../../bullmq-demo/redis';

export const bridgeQueue = new Queue('bridge-jobs', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 10,
    backoff: {
      type: 'exponential',
      delay: 5_000, // 5s, 10s, 20s, ...
    },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});
