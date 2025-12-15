import { Queue } from 'bullmq';
import { redisConnection } from './redis';

export const demoQueue = new Queue('demo-queue', {
  connection: redisConnection,
});
