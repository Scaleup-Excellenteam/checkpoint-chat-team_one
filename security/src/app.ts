import express from 'express';
import { json } from 'body-parser';
import errorHandler from './middleware/errorHandler';
import messageRouter from './routes/messages.route';
import { Router } from "express";

const app = express();
const health = Router();

// Middleware
app.use(json());
app.use(errorHandler);

// Routes
health.get("/health", (_req, res) => res.status(200).json({ ok: true }));
app.use(health);

app.get('/readyz', (req, res) => {
    res.status(200).send({ status: 'READY' });
});
// Export the app for use in other modules (e.g., server setup)

app.use('/message', messageRouter);


export default app;