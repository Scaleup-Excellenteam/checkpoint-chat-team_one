import type { Request, Response } from 'express';
import Message from '../models/message.model';

// Get all messages for a specific room (by roomName)
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { roomName } = req.params;
    const messages = await Message.find({ room: roomName }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error });
  }
};

// Create a new message in a specific room (by roomName)
export const createMessage = async (req: Request, res: Response) => {
  try {
    const { user, content } = req.body;
    const { roomName } = req.params;
    if (!roomName || !user || !content) {
      return res.status(400).json({ message: 'Room, user, and content are required' });
    }
    const newMessage = new Message({
      room: roomName,
      user,
      content,
      createdAt: new Date()
    });
    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create message', error });
  }
};

/**
 * Delete a message by ID
 */
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedMessage = await Message.findByIdAndDelete(id);
    
    if (!deletedMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete message', error });
  }
};
