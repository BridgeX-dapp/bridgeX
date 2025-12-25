import dotenv from 'dotenv';
import { startAllEvmListeners } from './chains/evm/listener';
import { checkEvmHealth } from './chains/evm/health';
import { runAllEvmBackfillsOnce } from './chains/evm/backFillProcessors';
import { runCasperBackfillOnce } from './chains/casper/backFillProcessors';
import { startBridgeWorker } from './executors/bridgeWorker';
import { startCasperListener } from './chains/casper/listener';

dotenv.config();

async function bootstrapWorker() {
  console.log('dYs? Bootstrapping BridgeX worker...');

  await checkEvmHealth();

  if (process.env.RUN_EVM_BACKFILL_ONCE === 'true') {
    await runAllEvmBackfillsOnce();
  }
  if (process.env.RUN_CASPER_BACKFILL_ONCE === 'true') {
    await runCasperBackfillOnce();
  }

  await startAllEvmListeners();
  await startCasperListener();
  await startBridgeWorker();

  console.log('dY`, Worker started (listeners + queue)');
}

bootstrapWorker().catch((err) => {
  console.error('Worker bootstrap failed', err);
  process.exit(1);
});

