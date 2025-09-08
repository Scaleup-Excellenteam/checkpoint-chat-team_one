import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';

interface User {
  id: string;
  username: string;
  room: string;
  ws: WebSocket;
}

interface MessageData {
  type: string;
  content?: string;
  username?: string;
  room?: string;
  timestamp?: string;
}

class WebSocketManager {
  private wss: WebSocketServer;
  private users: Map<WebSocket, User> = new Map();
  private rooms: Map<string, Set<WebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      const clientIP = request.socket.remoteAddress;
      console.log('📡 New WebSocket connection from:', clientIP);

      // Set up message handler
      ws.on('message', (data: Buffer) => {
        try {
          const message: MessageData = JSON.parse(data.toString());
          console.log('📨 Received raw message:', data.toString());
          console.log('📋 Parsed message:', message);
          
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('❌ Error parsing message:', error);
          this.sendToClient(ws, {
            type: 'error',
            content: 'Invalid message format'
          });
        }
      });

      // Set up close handler
      ws.on('close', () => {
        const user = this.users.get(ws);
        const username = user?.username || 'unknown user';
        const room = user?.room || 'none';
        
        console.log('👋 WebSocket disconnected:', username, 'from room', room);
        
        if (user) {
          // Remove from room
          const roomUsers = this.rooms.get(user.room);
          if (roomUsers) {
            roomUsers.delete(ws);
            if (roomUsers.size === 0) {
              this.rooms.delete(user.room);
            }
          }
          
          // Remove from users
          this.users.delete(ws);
          
          // Notify other users in the room
          this.broadcastToRoom(user.room, {
            type: 'user_left',
            username: user.username,
            room: user.room,
            timestamp: new Date().toISOString()
          }, ws);
        }
      });

      // Set up error handler
      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });

    console.log('🚀 WebSocket server is running');
  }

  private handleMessage(ws: WebSocket, message: MessageData) {
    switch (message.type) {
      case 'join':
        this.handleJoin(ws, message);
        break;
      case 'message':
        this.handleChatMessage(ws, message);
        break;
      case 'leave':
        this.handleLeave(ws, message);
        break;
      default:
        console.log('❓ Unknown message type:', message.type);
        this.sendToClient(ws, {
          type: 'error',
          content: 'Unknown message type'
        });
    }
  }

  private handleJoin(ws: WebSocket, message: MessageData) {
    const { username, room = 'general' } = message;
    
    if (!username) {
      this.sendToClient(ws, {
        type: 'error',
        content: 'Username is required'
      });
      return;
    }

    console.log('🚪 Join room request:', message);

    // Remove user from previous room if exists
    const existingUser = this.users.get(ws);
    if (existingUser) {
      const oldRoomUsers = this.rooms.get(existingUser.room);
      if (oldRoomUsers) {
        oldRoomUsers.delete(ws);
      }
    }

    // Create user object
    const user: User = {
      id: `${username}_${Date.now()}`,
      username,
      room,
      ws
    };

    // Add to users map
    this.users.set(ws, user);

    // Add to room
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(ws);

    // Send join confirmation to user
    this.sendToClient(ws, {
      type: 'join',
      username,
      room,
      timestamp: new Date().toISOString()
    });

    // Notify other users in the room
    this.broadcastToRoom(room, {
      type: 'user_joined',
      username,
      room,
      timestamp: new Date().toISOString()
    }, ws);

    console.log(`✅ User ${username} joined room ${room}`);
    console.log(`📊 Room ${room} now has ${this.rooms.get(room)?.size} users`);
  }

  private handleChatMessage(ws: WebSocket, message: MessageData) {
    const user = this.users.get(ws);
    
    if (!user) {
      this.sendToClient(ws, {
        type: 'error',
        content: 'You must join a room first'
      });
      return;
    }

    if (!message.content || message.content.trim() === '') {
      this.sendToClient(ws, {
        type: 'error',
        content: 'Message content cannot be empty'
      });
      return;
    }

    console.log(`💬 Chat message from ${user.username} in ${user.room}:`, message.content);

    // Create message object
    const chatMessage: MessageData = {
      type: 'message',
      content: message.content.trim(),
      username: user.username,
      room: user.room,
      timestamp: new Date().toISOString()
    };

    // Broadcast to all users in the room (including sender)
    this.broadcastToRoom(user.room, chatMessage);
    
    console.log(`📤 Message broadcasted to room ${user.room}`);
  }

  private handleLeave(ws: WebSocket, message: MessageData) {
    const user = this.users.get(ws);
    
    if (!user) {
      return;
    }

    // Remove from room
    const roomUsers = this.rooms.get(user.room);
    if (roomUsers) {
      roomUsers.delete(ws);
      if (roomUsers.size === 0) {
        this.rooms.delete(user.room);
      }
    }

    // Remove from users
    this.users.delete(ws);

    // Send leave confirmation
    this.sendToClient(ws, {
      type: 'leave',
      username: user.username,
      room: user.room,
      timestamp: new Date().toISOString()
    });

    // Notify other users
    this.broadcastToRoom(user.room, {
      type: 'user_left',
      username: user.username,
      room: user.room,
      timestamp: new Date().toISOString()
    }, ws);

    console.log(`👋 User ${user.username} left room ${user.room}`);
  }

  private sendToClient(ws: WebSocket, message: MessageData) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const messageStr = JSON.stringify(message);
        ws.send(messageStr);
        console.log('📤 Sent to client:', messageStr);
      } catch (error) {
        console.error('❌ Error sending message to client:', error);
      }
    }
  }

  private broadcastToRoom(room: string, message: MessageData, excludeWs?: WebSocket) {
    const roomUsers = this.rooms.get(room);
    
    if (!roomUsers || roomUsers.size === 0) {
      console.log(`⚠️ No users in room ${room} to broadcast to`);
      return;
    }

    let sentCount = 0;
    roomUsers.forEach(userWs => {
      if (userWs !== excludeWs && userWs.readyState === WebSocket.OPEN) {
        try {
          const messageStr = JSON.stringify(message);
          userWs.send(messageStr);
          sentCount++;
        } catch (error) {
          console.error('❌ Error broadcasting to user:', error);
        }
      }
    });

    console.log(`📢 Broadcasted message to ${sentCount} users in room ${room}`);
  }

  // Public methods for external use
  public getRoomUsers(room: string): string[] {
    const roomUsers = this.rooms.get(room);
    if (!roomUsers) return [];
    
    const usernames: string[] = [];
    roomUsers.forEach(ws => {
      const user = this.users.get(ws);
      if (user) {
        usernames.push(user.username);
      }
    });
    
    return usernames;
  }

  public getAllRooms(): string[] {
    return Array.from(this.rooms.keys());
  }

  public getUserCount(): number {
    return this.users.size;
  }
}

// Export the setup function
export const setupWebSocketServer = (server: Server): WebSocketManager => {
  console.log('🔧 Setting up WebSocket server...');
  const wsManager = new WebSocketManager(server);
  console.log('✅ WebSocket server setup complete');
  return wsManager;
};

export default WebSocketManager;