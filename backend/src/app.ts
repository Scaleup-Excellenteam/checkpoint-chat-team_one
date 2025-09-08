import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import errorHandler from './middleware/errorHandler';
import apiRouter from './routes/api.routes';
import { authRouter } from './routes/auth.route';
import roomRouter from './routes/rooms.route';
import messagesRouter from './routes/messages.route';

const app = express();

// CORS Middleware
app.use(cors({
  origin: true, // Allow requests from any origin
  credentials: true,
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRouter);
app.use('/rooms', roomRouter);
app.use('/auth', authRouter);
app.use('/messages', messagesRouter);

// Error Handler Middleware
app.use(errorHandler);

export default app;