import { Request, Response } from 'express';
import { WebSocket } from 'ws';


const express = require('express');
const serverRoutes = require('./routes/server_routes');
const { WebSocketServer } = require('ws');
const { connectDB } = require('./serviecs/db');

connectDB();

const app = express();
const port = 3000;

const wss = new WebSocketServer({ port: 8080 });
wss.on('connection', (ws: WebSocket) => {
  console.log('New WebSocket connection: ', ws);
  ws.on('message', (message: string) => {
    console.log(`Received message: ${message}`);
  });
});


app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from server');
});

app.use(serverRoutes.default);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
