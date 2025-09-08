import Room, { IRoom } from '../models/room.model';
import User from '../models/user.model'; // Assuming a User model exists
import Message from '../models/message.model'; // Assuming a Message model exists

/**
 * Get all rooms from the database.
 */
export const getAllRoomsService = async (): Promise<IRoom[]> => {
  return Room.find();
};

/**
 * Get a single room by its name.
 * @param roomName - The name of the room.
 */
export const getRoomByNameService = async (roomName: string): Promise<IRoom | null> => {
  return Room.findOne({ name: roomName });
};

/**
 * Create a new room.
 * @param name - The name of the room.
 * @param username - The username of the creator, who will be an admin.
 */
export const createRoomService = async (name: string, username: string): Promise<IRoom> => {
  const existingRoom = await Room.findOne({ name });
  if (existingRoom) {
    throw new Error('Room name already exists');
  }

  const now = new Date();
  const room = new Room({
    name,
    users: [{ username, joinedAt: now }],
    admins: [username],
    createdAt: now,
  });

  await room.save();
  return room;
};

/**
 * Add a user to a room.
 * @param roomName - The name of the room to join.
 * @param username - The username of the user joining.
 */
export const joinRoomService = async (roomName: string, username: string): Promise<IRoom> => {
  const room = await Room.findOne({ name: roomName });
  if (!room) {
    throw new Error('Room not found');
  }

  const user = await User.findOne({ username });
  if (!user) {
    throw new Error('Invalid user');
  }

  if (room.users.some(u => u.username === username)) {
    throw new Error('User already in room');
  }

  room.users.push({
    username, joinedAt: new Date(),
    userId: undefined
  });
  await room.save();
  return room;
};

/**
 * Delete a room. Only admins can perform this action.
 * @param roomName - The name of the room to delete.
 * @param username - The username of the user attempting to delete the room.
 */
export const deleteRoomService = async (roomName: string, username: string): Promise<void> => {
  const room = await Room.findOne({ name: roomName });
  if (!room) {
    throw new Error('Room not found');
  }

  if (!room.admins.includes(username)) {
    throw new Error('Only admin can delete the room');
  }

  await room.deleteOne();
};

/**
 * Get messages for a room, filtered by the user's join time.
 * @param roomName - The name of the room.
 * @param username - The username of the user requesting messages.
 */
export const getMessagesForRoomService = async (roomName: string, username: string): Promise<any[]> => {
  const room = await Room.findOne({ name: roomName });
  if (!room) {
    throw new Error('Room not found');
  }

  const userInRoom = room.users.find(u => u.username === username);
  if (!userInRoom) {
    throw new Error('User is not a member of this room');
  }

  const joinTime = userInRoom.joinedAt;
  return Message.find({ room: roomName, createdAt: { $gte: joinTime } }).sort({ createdAt: 1 });
};

/**
 * Post a new message to a room.
 * @param roomName - The name of the room.
 * @param username - The username of the sender.
 * @param content - The message content.
 */
export const sendMessageToRoomService = async (roomName: string, username: string, content: string): Promise<any> => {
  const room = await Room.findOne({ name: roomName });
  if (!room) {
    throw new Error('Room not found');
  }

  const user = await User.findOne({ username });
  if (!user) {
    throw new Error('Invalid user');
  }

  const message = new Message({
    room: roomName,
    user: username,
    content,
    createdAt: new Date(),
  });
  await message.save();

  // Note: WebSocket broadcasting logic should be handled, perhaps by emitting an event here
  // that a WebSocket service listens for. For now, returning the message.

  return message;
};

export const updateRoomService = async (roomName: string, updates: Partial<IRoom>): Promise<IRoom | null> => {
  const room = await Room.findOneAndUpdate({ name: roomName }, updates, { new: true });
  return room;
};