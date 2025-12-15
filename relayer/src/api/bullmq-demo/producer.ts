import { demoQueue } from './queue';

async function run() {
  await demoQueue.add(
    'say-hello', // job name (type)
    { name: 'Kabugu' }, // job data
    {
      attempts: 3, // retry 3 times on failure
      backoff: {
        type: 'exponential',
        delay: 1000, // 1s → 2s → 4s
      },
    },
  );

  console.log('✅ Job added to queue');
}

run();
