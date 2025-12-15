import { Worker } from 'bullmq';
import { redisConnection } from './redis';

new Worker(
  'demo-queue', // same queue name
  async (job) => {
    console.log('👷 Processing job:', job.name);
    console.log('📦 Job data:', job.data);

    if (job.name === 'say-hello') {
      console.log(`👋 Hello ${job.data.name}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // process 2 jobs in parallel
  },
);

console.log('🚀 Worker started');
