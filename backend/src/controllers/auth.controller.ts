import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import User from '../models/user.model';
import { env } from '../config/env';

const registerSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscore are allowed'),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export const register = async (req: Request, res: Response) => {
  try {
    console.log('Registration request body:', req.body);
    
    // Validate request body
    try {
      const { username, email, password } = registerSchema.parse(req.body);
      
      // Duplicate check
      const existing = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
      }).lean();

      if (existing) {
        return res.status(409).json({ message: 'Username or email already in use' });
      }

      // Hash password
      const hash = await bcrypt.hash(password, 10);

      // Create user (store lowercase for uniqueness)
      const user = await User.create({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hash, // assuming your model uses `password` field
      });

      // Sign JWT
      const token = jwt.sign(
        { sub: user._id.toString(), username: user.username },
        env.JWT_SECRET as Secret,
        { expiresIn: (env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'] }
      );

      return res.status(201).json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
        token,
      });
    } catch (validationErr: any) {
      if (validationErr.name === 'ZodError') {
        console.error('Validation error:', validationErr.issues);
        return res.status(400).json({ message: 'Invalid payload', issues: validationErr.issues });
      }
      throw validationErr;
    }
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Internal server error during registration' });
    console.error('REGISTER_ERROR:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const loginSchema = z.object({
  identifier: z.string().min(3), // username or email
  password: z.string().min(6).max(128),
});

export const login = async (req: Request, res: Response) => {
  try {
    console.log('Login request body:', req.body);
    
    try {
      const { identifier, password } = loginSchema.parse(req.body);

      const query = identifier.includes('@')
        ? { email: identifier.toLowerCase() }
        : { username: identifier.toLowerCase() };

      console.log('Looking for user with query:', query);
      const user = await User.findOne(query);
      if (!user) {
        console.log('User not found');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        console.log('Password does not match');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { sub: user._id.toString(), username: user.username },
        env.JWT_SECRET as Secret,
        { expiresIn: (env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'] }
      );

      console.log('Login successful for user:', user.username);
      
      return res.json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
        token,
        message: 'Login successful'
      });
    } catch (validationErr: any) {
      if (validationErr.name === 'ZodError') {
        console.error('Validation error:', validationErr.issues);
        return res.status(400).json({ message: 'Invalid payload', issues: validationErr.issues });
      }
      throw validationErr;
    }
  } catch (err: any) {
    console.error('LOGIN_ERROR:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};