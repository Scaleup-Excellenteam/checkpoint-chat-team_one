
import { Router, Request, Response } from 'express';
import User from '../models/User';
import Room from '../models/Room';
import Message from '../models/Message';
import { rooms } from '../app';
import { WebSocket } from 'ws';
import { Types, ObjectId } from 'mongoose';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

router.get('/readyz', (req: Request, res: Response) => {
  res.status(200).json({ ready: true });
});


// User Registration
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password }: { username: string; email: string; password: string } = req.body;
    const user = new User({ username, email, password });
    await user.save();
    res.status(201).json({ message: 'User registered', user });
  } catch (err) {
    res.status(400).json({ error: 'Registration failed', details: err });
  }
});

// User Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password }: { email: string; password: string } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err });
  }
});


// Create Room
router.post('/rooms', async (req: Request, res: Response) => {
  try {
    const { name, username }: { name: string; username: string } = req.body;
    // Check if room name is unique
    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({ error: 'Room name already exists' });
    }
    const now = new Date();
    const room = new Room({
      name,
      users: [{ username, joinedAt: now }],
      admins: [username],
      createdAt: now
    });
    await room.save();
    res.status(201).json({ message: 'Room created', room });

// Join a room (adds user to room with join time)
router.post('/rooms/:roomName/join', async (req: Request, res: Response) => {
  try {
    const { username }: { username: string } = req.body;
    const { roomName } = req.params;
    const room = await Room.findOne({ name: roomName });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid user' });
    }
    // Check if user already in room
    if (room.users.some(u => u.username === username)) {
      return res.status(400).json({ error: 'User already in room' });
    }
    room.users.push({ username, joinedAt: new Date() });
    await room.save();
    res.status(200).json({ message: 'User joined room', room });
  } catch (err) {
    res.status(400).json({ error: 'Failed to join room', details: err });
  }
});
  } catch (err) {
    res.status(400).json({ error: 'Room creation failed', details: err });
  }
});

// Delete Room (only admin)
router.delete('/rooms/:roomName', async (req: Request, res: Response) => {
  try {
    const { username }: { username: string } = req.body;
    const { roomName } = req.params;
    const room = await Room.findOne({ name: roomName });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    // Check if user is admin
    if (!room.admins.includes(username)) {
      return res.status(403).json({ error: 'Only admin can delete the room' });
    }
    await room.deleteOne();
    res.status(200).json({ message: 'Room deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Room deletion failed', details: err });
  }
});


// Get all messages for a room for a specific user (only messages sent after user joined)
router.get('/rooms/:roomName/message', async (req: Request, res: Response) => {
  try {
    const { roomName } = req.params;
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: 'username is required as query param' });
    }
    const room = await Room.findOne({ name: roomName });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    // Find the join time for this user
    const userInRoom = room.users.find(u => u.username === username);
    if (!userInRoom) {
      return res.status(403).json({ error: 'User is not a member of this room' });
    }
    const joinTime = userInRoom.joinedAt;
    const messages = await Message.find({ room: roomName, createdAt: { $gte: joinTime } })
      .sort({ createdAt: 1 });
    res.status(200).json({ messages });
  } catch (err) {
    res.status(400).json({ error: 'Failed to get messages', details: err });
  }
});

// Send a message to a room by a user
router.post('/rooms/:roomName/message', async (req: Request, res: Response) => {
  try {
    const { roomName } = req.params;
    const { username, content } = req.body;
    const room = await Room.findOne({ name: roomName });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid user' });
    }
    const message = new Message({ room: roomName, user: username, content, createdAt: new Date() });
    await message.save();

    // Broadcast to WebSocket clients in the room
    const payload = {
      type: 'message',
      username,
      room: roomName,
      content,
      timestamp: message.createdAt,
    };
    if (rooms[roomName]) {
      rooms[roomName].forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(payload));
        }
      });
    }

    res.status(201).json({ info: 'Message sent', message });
  } catch (err) {
    res.status(400).json({ error: 'Message sending failed', details: err });
  }
});




export default router;
