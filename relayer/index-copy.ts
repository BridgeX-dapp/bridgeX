// index.ts
//import express, { Express, Request, Response } from 'express';
//import dotenv from 'dotenv';

//import cors from 'cors';
//import cron from 'node-cron';
//import { WebSocketServer } from 'ws';
//import { createServer } from 'http';
//import { Server } from 'socket.io';



//1.  IMPORT UTILS AND CONTROLLERS
//dotenv.config();

// 2. initialize app 
//const app: Express = express();
//const server = createServer(app); // http
//const port = process.env.PORT || 4000;

/*app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3001',
      'https://xts-pay-dashboard.vercel.app',
      'https://www.munapay.xyz',
      'https://munapay-store.vercel.app',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST'],
  },
});*/

/*io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('join_checkout', (checkoutId) => {
    socket.join(`checkout:${checkoutId}`);
  });
  socket.on('disconnect', () => console.log('user disconnected'));
});
app.get('/', (req: Request, res: Response) => {
  res.status(200).send('GOAT');
});*/

// ✅ REST routes
//app.use('/api/v1/users', userRoutes);


// ✅ Cron job example
//cron.schedule('*/30 * * * * *', async () => {
  /*console.log(
    '[CRON] Running wallet registration job at',
    new Date().toISOString(),
  );*/
  // await processPendingUsers();
  // await processPendingTransfers();

  // update pending tx
 /* const pendingTxs = await prisma.paymentSession.findMany({
    where: {
      status: 'pending',
    },
  });
  console.log(`This is pending : ${pendingTxs[0].id}`);
  for (const tx of pendingTxs) {
    if (!tx.txid) {
      console.log(`Skipping session ${tx.id} because txid is null`);
      continue;
    }
    const txResult = await checkTxStatus(tx.txid);
    if (!txResult) {
      console.log(`No result for tx: ${tx.txid}`);
      continue;
    }

    console.log(`Tx result: ${txResult.status}`);

    if (txResult.status === 'success') {
      try {
        await prisma.paymentSession.update({
          where: { id: tx.id },
          data: {
            txid: tx.txid,
            status: 'comfirmed',
            verificationAttempts: { increment: 1 },
          },
        });
        console.log('Updated DB ✅');
        io.to(`checkout:${tx.id}`).emit('paymentStatus', {
          status: 'comfirmed',
          sessionId: tx.id,
          txId: tx.txid,
        });
      } catch (err) {
        console.error('Prisma update failed ❌', err);
      }
    } else if (txResult.status === 'failed') {
      try {
        await prisma.paymentSession.update({
          where: { id: tx.id },
          data: {
            txid: tx.txid,
            status: 'failed',
            verificationAttempts: { increment: 1 },
          },
        });
        console.log('Updated DB ✅');
        io.to(`checkout:${tx.id}`).emit('paymentStatus', {
          status: 'failed',
          sessionId: tx.id,
          txId: tx.txid,
        });
      } catch (err) {
        console.error('Prisma update failed ❌', err);
      }
    } else if (txResult.status === 'abort_by_response') {
      try {
        await prisma.paymentSession.update({
          where: { id: tx.id },
          data: {
            txid: tx.txid,
            status: 'failed',
            verificationAttempts: { increment: 1 },
          },
        });
        console.log('Updated DB ✅');
        io.to(`checkout:${tx.id}`).emit('paymentStatus', {
          status: 'failed',
          sessionId: tx.id,
          txId: tx.txid,
        });
      } catch (err) {
        console.error('Prisma update failed ❌', err);
      }
    } else if (txResult.status === 'abort_by_post_condition') {
      try {
        await prisma.paymentSession.update({
          where: { id: tx.id },
          data: {
            txid: tx.txid,
            status: 'failed',
            verificationAttempts: { increment: 1 },
          },
        });
        console.log('Updated DB ✅');
        io.to(`checkout:${tx.id}`).emit('paymentStatus', {
          status: 'failed',
          sessionId: tx.id,
          txId: tx.txid,
        });
      } catch (err) {
        console.error('Prisma update failed ❌', err);
      }
    }
  }
});

server.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

app.set('socketio', io);*/
