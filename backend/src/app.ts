import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import errorHandler from './middleware/errorHandler';
import serverRouter from './routes/server_routes';

const app = express();

// CORS Middleware
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', serverRouter);

// Error Handler Middleware
app.use(errorHandler);

export default app;