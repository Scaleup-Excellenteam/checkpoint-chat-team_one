// test/message.test.ts

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Message from '../src/models/message.model'; // Adjust the import path

let mongoServer: MongoMemoryServer;

// --- Test Setup ---

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clean up after each test
afterEach(async () => {
  await Message.deleteMany({});
});

// --- Test Suite ---

describe('Message Model Test', () => {

  // Test 1: Successful message creation (Happy Path)
  it('should create and save a message successfully', async () => {
    const messageData = {
      room: new Types.ObjectId(),
      user: new Types.ObjectId(),
      content: 'Hello, world!',
    };
    const validMessage = new Message(messageData);
    const savedMessage = await validMessage.save();

    // Assertions
    expect(savedMessage._id).toBeDefined();
    expect(savedMessage.room.toString()).toBe(messageData.room.toString());
    expect(savedMessage.user.toString()).toBe(messageData.user.toString());
    expect(savedMessage.content).toBe(messageData.content);
    expect(savedMessage.createdAt).toBeDefined();
  });

  // Test 2: Validation for missing 'room'
  it('should fail to create a message without a room', async () => {
    const messageData = {
      user: new Types.ObjectId(),
      content: 'This message has no room.',
    };
    const messageWithoutRoom = new Message(messageData);
    await expect(messageWithoutRoom.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  // Test 3: Validation for missing 'user'
  it('should fail to create a message without a user', async () => {
    const messageData = {
      room: new Types.ObjectId(),
      content: 'This message has no user.',
    };
    const messageWithoutUser = new Message(messageData);
    await expect(messageWithoutUser.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  // Test 4: Validation for missing 'content'
  it('should fail to create a message without content', async () => {
    const messageData = {
      room: new Types.ObjectId(),
      user: new Types.ObjectId(),
    };
    const messageWithoutContent = new Message(messageData);
    await expect(messageWithoutContent.save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

});