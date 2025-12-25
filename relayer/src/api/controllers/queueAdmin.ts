import expressAsyncHandler from 'express-async-handler';
import { bridgeQueue } from '../lib/utils/jobs/queue/queue';

export const getQueueStatus = expressAsyncHandler(async (_req, res) => {
  const counts = await bridgeQueue.getJobCounts(
    'waiting',
    'active',
    'delayed',
    'failed',
    'completed',
  );

  res.status(200).json({
    queue: 'bridge-jobs',
    counts,
  });
});

export const drainQueue = expressAsyncHandler(async (req, res) => {
  const { force } = req.body ?? {};

  await bridgeQueue.drain(Boolean(force));

  res.status(200).json({
    queue: 'bridge-jobs',
    drained: true,
    force: Boolean(force),
  });
});

export const pauseQueue = expressAsyncHandler(async (_req, res) => {
  await bridgeQueue.pause();
  res.status(200).json({ queue: 'bridge-jobs', paused: true });
});

export const resumeQueue = expressAsyncHandler(async (_req, res) => {
  await bridgeQueue.resume();
  res.status(200).json({ queue: 'bridge-jobs', paused: false });
});
