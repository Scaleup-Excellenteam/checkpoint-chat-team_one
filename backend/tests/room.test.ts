// room.test.ts

import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Room from '../src/models/Room'; // Adjust the import path to your model file


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

// Clean up the collection after each test to ensure isolation
afterEach(async () => {
  await Room.deleteMany({});
});


// --- Test Suite ---

describe('Room Model Test', () => {

  // Test 1: Successful room creation
  it('should create and save a room successfully', async () => {
    const roomData = { name: 'General Chat' };
    const validRoom = new Room(roomData);
    const savedRoom = await validRoom.save();

    // Assertions
    expect(savedRoom._id).toBeDefined();
    expect(savedRoom.name).toBe(roomData.name);
    expect(savedRoom.users).toEqual([]);
    expect(savedRoom.admins).toEqual([]);
    expect(savedRoom.createdAt).toBeDefined();
  });

  // Test 2: Test the 'required' validation for the name field
  it('should fail to create a room without a name field', async () => {
    const roomWithoutName = new Room({ users: [] }); // Missing 'name'
    let err: any;
    try {
      await roomWithoutName.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.name).toBeDefined();
  });

  // Test 3: Test the 'unique' constraint for the name field
  it('should fail to create a room with a duplicate name', async () => {
    // Save the first room
    const room1 = new Room({ name: 'Unique Room' });
    await room1.save();

    // Attempt to save a second room with the same name
    const room2 = new Room({ name: 'Unique Room' });
    let err: any;
    try {
        await room2.save();
    } catch (error) {
        err = error;
    }
    // Mongoose duplicate key error code is 11000
    expect(err).toBeDefined();
    expect(err.code).toBe(11000);
  });

  // Test 4: Test adding users and admins
  it('should correctly add a user and an admin', async () => {
    const userId = new Types.ObjectId();
    const roomData = {
        name: 'Advanced Chat',
        users: [{ user: userId, joinedAt: new Date() }],
        admins: [userId]
    };
    const room = new Room(roomData);
    const savedRoom = await room.save();

    // Assertions
    expect(savedRoom.users.length).toBe(1);
  // expect(savedRoom.users[0].user).toEqual(userId); PLEASE FIX THIS
    expect(savedRoom.admins.length).toBe(1);
    expect(savedRoom.admins[0]).toEqual(userId);
  });
});