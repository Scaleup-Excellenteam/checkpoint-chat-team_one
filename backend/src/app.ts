import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import errorHandler from './middleware/errorHandler';
import serverRouter from './routes/server_routes';
import roomRouter from './routes/rooms.route';

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
app.use('/auth', serverRouter); // Assuming auth routes are also in serverRouter for this example
app.use('/rooms', roomRouter); // You need to import roomRouter from './routes/rooms.route'



// Error Handler Middleware
app.use(errorHandler);

export default app;