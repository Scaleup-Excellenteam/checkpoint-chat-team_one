import { Request, Response } from 'express';
import { WebSocket } from 'ws';


const express = require('express');
const serverRoutes = require('./routes/server_routes');
const { WebSocketServer } = require('ws');
const { connectDB } = require('./serviecs/db');

connectDB();

const app = express();
const port = 3000;


// --- WebSocket Room Management ---
interface RoomConnection extends WebSocket {
  username?: string;
  room?: string;
}

const wss = new WebSocketServer({ port: 8080 });
export const rooms: { [room: string]: Set<RoomConnection> } = {};

wss.on('connection', (ws: RoomConnection) => {
  console.log('New WebSocket connection');

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'join') {
        // { type: 'join', username, room }
        ws.username = msg.username;
        ws.room = msg.room;
        if (typeof ws.room === 'string') {
          if (!rooms[ws.room]) rooms[ws.room] = new Set();
          rooms[ws.room].add(ws);
          ws.send(JSON.stringify({ type: 'system', message: `Joined room ${ws.room}` }));
          console.log(`${ws.username} joined room ${ws.room}`);
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Room name required.' }));
        }
      } else if (msg.type === 'message') {
        // { type: 'message', content }
        if (!ws.room || !ws.username) {
          ws.send(JSON.stringify({ type: 'error', message: 'Join a room first.' }));
          return;
        }
        // Broadcast to all in the room
        const payload = {
          type: 'message',
          username: ws.username,
          room: ws.room,
          content: msg.content,
          timestamp: new Date().toISOString(),
        };
        rooms[ws.room]?.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(payload));
          }
        });
        console.log(`Broadcasted message in room ${ws.room}: ${msg.content}`);
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format.' }));
    }
  });

  ws.on('close', () => {
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room].delete(ws);
      if (rooms[ws.room].size === 0) delete rooms[ws.room];
    }
    console.log(`WebSocket disconnected: ${ws.username || 'unknown'} from room ${ws.room || 'none'}`);
  });
});


app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from server');
});

const cors = require('cors');
app.use(cors());

app.use(serverRoutes.default);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
