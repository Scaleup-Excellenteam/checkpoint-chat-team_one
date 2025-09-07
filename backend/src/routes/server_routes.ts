
import { Router, Request, Response } from 'express';
import User from '../models/User';
import Room from '../models/Room';
import Message from '../models/Message';
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
    const { name, userId }: { name: string; userId: string } = req.body;
    // Check if room name is unique
    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({ error: 'Room name already exists' });
    }
        const now = new Date();
        const room = new Room({
          name,
          users: [{ user: userId, joinedAt: now }],
          admins: [userId],
          createdAt: now
        });
        await room.save();
        res.status(201).json({ message: 'Room created', room });

// Join a room (adds user to room with join time)
router.post('/rooms/:roomId/join', async (req: Request, res: Response) => {
  try {
    const { userId }: { userId: Types.ObjectId | string } = req.body;
    const { roomId } = req.params;
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid user' });
    }
    // Check if user already in room
    if (room.users.some(u => u.user.equals(userId.toString()))) {
      return res.status(400).json({ error: 'User already in room' });
    }
    room.users.push({ user: new Types.ObjectId(userId), joinedAt: new Date() });
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
router.delete('/rooms/:roomId', async (req: Request, res: Response) => {
  try {
    const { userId }: { userId: ObjectId } = req.body;
    const { roomId } = req.params;
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    // Check if user is admin
    if (!room.admins.map(id => id.toString()).includes(userId.toString())) {
      return res.status(403).json({ error: 'Only admin can delete the room' });
    }
    await room.deleteOne();
    res.status(200).json({ message: 'Room deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Room deletion failed', details: err });
  }
});


// Get all messages for a room for a specific user (only messages sent after user joined)
router.get('/rooms/:roomId/message', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required as query param' });
    }
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    // Find the join time for this user
    const userInRoom = room.users.find(u => u.user.toString() === userId);
    if (!userInRoom) {
      return res.status(403).json({ error: 'User is not a member of this room' });
    }
    const joinTime = userInRoom.joinedAt;
    const messages = await Message.find({ room: roomId, createdAt: { $gte: joinTime } })
      .populate('user', 'username')
      .sort({ createdAt: 1 });
    res.status(200).json({ messages });
  } catch (err) {
    res.status(400).json({ error: 'Failed to get messages', details: err });
  }
});

// Send a message to a room by a user
router.post('/rooms/:roomId/message', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { userId, content } = req.body;
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid user' });
    }
    const message = new Message({ room: roomId, user: userId, content, createdAt: new Date() });
    await message.save();
  res.status(201).json({ info: 'Message sent', message });
  } catch (err) {
    res.status(400).json({ error: 'Message sending failed', details: err });
  }
});




export default router;
