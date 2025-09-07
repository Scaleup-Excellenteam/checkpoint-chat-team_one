import express from 'express';
import cors from 'cors';
import serverRoutes from './routes/server_routes';
import roomRouter from './routes/rooms.route';
import errorHandler from './middleware/errorHandler';

const app = express();

// Fix CORS to allow multiple origins
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'http://localhost:4173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/', serverRoutes);
app.use('/rooms', roomRouter);

// Error handling middleware
app.use(errorHandler);

export default app;