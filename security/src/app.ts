import express from 'express';
import { json } from 'body-parser';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth.routes';

const app = express();

// Middleware
app.use(json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

export default app;