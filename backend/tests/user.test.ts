// test/user.test.ts

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../src/models/user.model'; // Adjust the import path

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

// Clean up the collection after each test
afterEach(async () => {
  await User.deleteMany({});
});

// --- Test Suite ---

describe('User Model Test', () => {

  // Test 1: Successful user creation (Happy Path)
  it('should create and save a user successfully', async () => {
    const userData = {
      username: 'johndoe',
      email: 'john.doe@example.com',
      password: 'password123',
    };
    const validUser = new User(userData);
    const savedUser = await validUser.save();

    // Assertions
    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.password).toBe(userData.password);
    expect(savedUser.createdAt).toBeDefined();
  });

  // Test 2: Validation for required fields
  it('should fail if required fields are missing', async () => {
    // Missing username
    await expect(new User({ email: 'test@test.com', password: '123' }).save()).rejects.toThrow(mongoose.Error.ValidationError);
    // Missing email
    await expect(new User({ username: 'testuser', password: '123' }).save()).rejects.toThrow(mongoose.Error.ValidationError);
    // Missing password
    await expect(new User({ username: 'testuser', email: 'test@test.com' }).save()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  // Test 3: Uniqueness constraint for username
  it('should fail to create a user with a duplicate username', async () => {
    const userData = { username: 'duplicateUser', email: 'user1@example.com', password: 'password123' };
    await new User(userData).save(); // Save the first user

    // Attempt to save a second user with the same username
    const duplicateUserData = { username: 'duplicateUser', email: 'user2@example.com', password: 'password123' };
    await expect(new User(duplicateUserData).save()).rejects.toThrow();
  });

  // Test 4: Uniqueness constraint for email
  it('should fail to create a user with a duplicate email', async () => {
    const userData = { username: 'user1', email: 'duplicate@example.com', password: 'password123' };
    await new User(userData).save(); // Save the first user

    // Attempt to save a second user with the same email
    const duplicateUserData = { username: 'user2', email: 'duplicate@example.com', password: 'password123' };
    await expect(new User(duplicateUserData).save()).rejects.toThrow();
  });

});