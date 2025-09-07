import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export interface RoomConnection extends WebSocket {
  username?: string;
  room?: string;
}

export const rooms: Record<string, Set<RoomConnection>> = {};

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server });
  
  console.log('🚀 WebSocket server initialized');
  
  wss.on('connection', (ws: RoomConnection, req) => {
    console.log('📡 New WebSocket connection from:', req.socket.remoteAddress);
    
    // Send immediate connection confirmation
    ws.send(JSON.stringify({ 
      type: 'connected', 
      message: 'WebSocket connection established' 
    }));
    
    ws.on('message', (data) => {
      try {
        const message = data.toString();
        console.log('📨 Received raw message:', message);
        
        const parsedMessage = JSON.parse(message);
        console.log('📋 Parsed message:', parsedMessage);
        
        if (parsedMessage.type === 'join') {
          handleJoinRoom(ws, parsedMessage);
        } else if (parsedMessage.type === 'message') {
          handleChatMessage(ws, parsedMessage);
        } else {
          console.log('❓ Unknown message type:', parsedMessage.type);
        }
      } catch (error) {
        console.error('❌ Error processing message:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });
    
    ws.on('close', () => {
      handleDisconnect(ws);
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  });
  
  return wss;
}

function handleJoinRoom(ws: RoomConnection, data: any) {
  console.log('🚪 Join room request:', data);
  
  ws.username = data.username;
  ws.room = data.room;
  
  if (!ws.room) {
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: 'Room name required' 
    }));
    return;
  }
  
  if (!rooms[ws.room]) {
    rooms[ws.room] = new Set();
  }
  
  rooms[ws.room].add(ws);
  
  // Send confirmation message that matches what frontend expects
  const confirmationMessage = {
    type: 'system',
    message: `Joined room ${ws.room}`
  };
  
  console.log('✅ Sending join confirmation:', confirmationMessage);
  ws.send(JSON.stringify(confirmationMessage));
  
  console.log(`👤 ${ws.username} joined room ${ws.room}. Room size: ${rooms[ws.room].size}`);
}

function handleChatMessage(ws: RoomConnection, data: any) {
  if (!ws.room || !ws.username) {
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: 'Join a room first' 
    }));
    return;
  }
  
  const payload = {
    type: 'message',
    username: ws.username,
    room: ws.room,
    content: data.content,
    timestamp: new Date().toISOString(),
  };
  
  console.log('💬 Broadcasting message:', payload);
  
  rooms[ws.room]?.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  });
  
  console.log(`📤 Message sent to ${rooms[ws.room]?.size || 0} clients in room ${ws.room}`);
}

function handleDisconnect(ws: RoomConnection) {
  if (ws.room && rooms[ws.room]) {
    rooms[ws.room].delete(ws);
    if (rooms[ws.room].size === 0) {
      delete rooms[ws.room];
    }
  }
  console.log(`👋 WebSocket disconnected: ${ws.username || 'unknown user'} from room ${ws.room || 'none'}`);
}