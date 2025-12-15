// Bull queues and process() handlers

import { Queue } from 'bullmq';
import { env } from '../../../../config/env';
import { QUEUES } from '../../../../config/constants';

export const evmToCasperQueue = new Queue(QUEUES.EVM_TO_CASPER, {
  connection: {
    url: env.REDIS_URL,
  },
});

export const casperToEvmQueue = new Queue(QUEUES.CASPER_TO_EVM, {
  connection: {
    url: env.REDIS_URL,
  },
});
