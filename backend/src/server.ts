import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { setupWebSocketServer } from './config/ws';

const BACKEND_PORT = process.env.BACKEND_PORT || 5000;

async function startServer() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');

    // Create HTTP server
    const server = http.createServer(app);

    // Setup WebSocket server
    const wsManager = setupWebSocketServer(server);
    console.log('✅ WebSocket server configured');

    // Start server
    server.listen(Number(BACKEND_PORT), '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${BACKEND_PORT}`);
      console.log(`📡 WebSocket server ready on all network interfaces`);
      console.log(`💻 Server accessible from other devices on your network`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();