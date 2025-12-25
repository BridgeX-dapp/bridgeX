// index.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { startAllEvmListeners } from './chains/evm/listener';
import { checkEvmHealth } from './chains/evm/health';
import lockNative from './routes/lockNative';
import { runAllEvmBackfillsOnce } from './chains/evm/backFillProcessors';
import { runCasperBackfillOnce } from './chains/casper/backFillProcessors';
import { startBridgeWorker } from './executors/bridgeWorker';
import { startCasperListener } from './chains/casper/listener';
import { startConfirmationPoller } from './executors/confirmations/poller';
import { startTransactionStream } from './realtime/transactions';
import catalogRoutes from './routes/catalog';
import { getCasperTokenBalance } from './controllers/getCasperTokenBalance';
import { getCasperTokenAllowance } from './controllers/getCasperTokenAllowance';
import { listTransactions } from './controllers/listTransactions';
import { faucetRequest } from './controllers/faucetRequest';

dotenv.config();

/* ----------------------------------
 * 1. App & Server
 * ---------------------------------- */
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 4000;

/* ----------------------------------
 * 2. Middleware
 * ---------------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

/* ----------------------------------
 * 3. Socket.IO
 * ---------------------------------- */
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

startTransactionStream(io);

// expose io to controllers / services
app.set('io', io);

/* ----------------------------------
 * 4. Routes
 * ---------------------------------- */
//app.get("/", (_, res) => res.send("BridgeX Relayer Running"));
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({ status: 'ok', ts: new Date().toISOString() });
});
app.use('/api/v1/tests', lockNative);
app.use('/api/v1/catalog', catalogRoutes);
app.get('/api/v1/transactions', listTransactions);
app.get('/api/v1/casper/token-balance', getCasperTokenBalance);
app.get('/api/v1/casper/token-allowance', getCasperTokenAllowance);
app.post('/api/v1/faucet/request', faucetRequest);

/* ----------------------------------
 * 5. Bootstrap services
 * ---------------------------------- */
async function bootstrap() {
  console.log('dYs? Bootstrapping BridgeX relayer...');

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
  startConfirmationPoller();

  console.log('dY`, Listeners + worker started');
}

/* ----------------------------------
 * 6. Start server
 * ---------------------------------- */
server.listen(PORT, async () => {
  console.log(`dYO? Server running on http://localhost:${PORT}`);
  await bootstrap();
});

// keep process alive (optional, node already does)
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);
