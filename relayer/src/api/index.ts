// index.ts
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

import cors from 'cors';
import cron from 'node-cron';
//import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { Server } from 'socket.io';

//1.  IMPORT UTILS AND CONTROLLERS
dotenv.config();

// 2. initialize app
const app: Express = express();
const server = createServer(app); // http
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
const io = new Server(server, {
  cors: {
    origin: ['*'],
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => console.log('user disconnected'));
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('GOAT');
});

// ✅ REST routes
//app.use('/api/v1/users', userRoutes);

server.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

app.set('socketio', io);
