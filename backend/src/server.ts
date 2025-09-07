import http from 'http';
import app from './app';
import { env } from './config/env';
import { setupWebSocketServer } from './config/ws';
import { connectDB } from './config/db';

async function startServer() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');
    
    // Create HTTP server
    const server = http.createServer(app);
    
    // Setup WebSocket server
    setupWebSocketServer(server);
    console.log('✅ WebSocket server configured');
    
    // Start the server
    server.listen(env.WS_PORT, () => {
      console.log(`🚀 Server running on port ${env.WS_PORT}`);
      console.log(`🌐 HTTP: http://localhost:${env.WS_PORT}`);
      console.log(`📡 WebSocket: ws://localhost:${env.WS_PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();