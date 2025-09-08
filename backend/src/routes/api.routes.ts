import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Health check endpoint
 * Used for monitoring service status
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * Readiness check endpoint
 * Confirms if the service is ready to accept requests
 */
router.get('/readyz', (req: Request, res: Response) => {
  res.status(200).json({ ready: true });
});

/**
 * API documentation endpoint
 * Provides information about available endpoints
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    apiVersion: '1.0',
    endpoints: {
      auth: {
        register: 'POST /auth/register - Create new user account',
        login: 'POST /auth/login - Authenticate user and get token'
      },
      rooms: {
        getAll: 'GET /rooms - Get all chat rooms',
        create: 'POST /rooms - Create a new chat room',
        getById: 'GET /rooms/:id - Get room details',
        update: 'PUT /rooms/:id - Update room information',
        delete: 'DELETE /rooms/:id - Delete a room'
      },
      messages: {
        getByRoom: 'GET /messages/room/:roomId - Get messages for a room',
        create: 'POST /messages - Send a new message',
        delete: 'DELETE /messages/:id - Delete a message'
      }
    }
  });
});

export default router;
