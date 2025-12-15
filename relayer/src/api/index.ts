// index.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { startEvmListener } from './chains/evm/listener';
import { checkEvmHealth } from './chains/evm/health';
import lockNative from './routes/lockNative';
import { runEvmBackfillOnce } from './chains/evm/backFillProcessors';
import { generateEventId } from './lib/utils/eventId';
import { startBridgeWorker } from './executors/evm/bridgeWorker';

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

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);
  socket.on('disconnect', () =>
    console.log('❌ Socket disconnected:', socket.id),
  );
});

// expose io to controllers / services
app.set('io', io);

/* ----------------------------------
 * 4. Routes
 * ---------------------------------- */
//app.get("/", (_, res) => res.send("BridgeX Relayer Running"));
app.use('/api/v1/tests', lockNative);

/* ----------------------------------
 * 5. Bootstrap services
 * ---------------------------------- */
async function bootstrap() {
  console.log('🚀 Bootstrapping BridgeX relayer...');

  await checkEvmHealth();
  //await runEvmBackfillOnce();
  // Start listeners ONCE
  await startEvmListener();
  startBridgeWorker();

  console.log('👂 EVM listener started');
}

/* ----------------------------------
 * 6. Start server
 * ---------------------------------- */
server.listen(PORT, async () => {
  console.log(`🌍 Server running on http://localhost:${PORT}`);
  await bootstrap();
});

// keep process alive (optional, node already does)
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);
