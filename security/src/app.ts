import express from 'express';
import { json } from 'body-parser';
import errorHandler from './middleware/errorHandler';
import messageRouter from './routes/messages.route';

const app = express();

// Middleware
app.use(json());
app.use(errorHandler);

// Routes
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'OK' });
});

app.get('/readyz', (req, res) => {
    res.status(200).send({ status: 'READY' });
});
// Export the app for use in other modules (e.g., server setup)

app.use('/message', messageRouter);


export default app;