import { Router } from 'express';
import { getMessages, createMessage, deleteMessage } from '../controllers/messages.controller';

const router = Router();

// Get all messages for a specific room
router.get('/rooms/:roomName/messages', getMessages);

// Create a new message in a specific room
router.post('/rooms/:roomName/messages', createMessage);

// Delete a message by ID (unchanged)
router.delete('/messages/:id', deleteMessage);

export default router;
