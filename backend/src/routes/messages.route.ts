import { Router } from 'express';
import { getMessages, createMessage, deleteMessage } from '../controllers/messages.controller';

const router = Router();

/**
 * Get all messages for a specific room
 * @route GET /messages/room/:roomId
 * @returns {Object[]} messages - Array of messages in the room
 */
router.get('/room/:roomId', getMessages);

/**
 * Create a new message
 * @route POST /messages
 * @body {Object} messageData - Message data (room, user, content)
 * @returns {Object} message - The created message
 */
router.post('/', createMessage);

/**
 * Delete a message by ID
 * @route DELETE /messages/:id
 * @param {string} id - Message ID
 * @returns {Object} result - Deletion confirmation
 */
router.delete('/:id', deleteMessage);

export default router;
