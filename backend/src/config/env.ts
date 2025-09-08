import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file from multiple possible locations
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Define environment schema with defaults where possible
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGO_URI: z.string().default('mongodb://localhost:27017/checkpoint-chat'),
  JWT_SECRET: z.string().default('supersecretkey123456789'), // Default for development only
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173')
});

// Log loaded environment variables for debugging
console.log('🔍 Environment variables loaded from process.env:');
console.log('- NODE_ENV:', process.env.NODE_ENV || '[not set]');
console.log('- PORT:', process.env.PORT || '[not set]');
console.log('- MONGO_URI:', process.env.MONGO_URI ? '[set]' : '[not set]');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '[set]' : '[not set]');
console.log('- JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || '[not set]');
console.log('- CORS_ORIGIN:', process.env.CORS_ORIGIN || '[not set]');

// Parse and validate environment variables
export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  CORS_ORIGIN: process.env.CORS_ORIGIN
});
console.log('✅ Environment variables validated successfully');

// Export typed environment variables
export const backendEnv = {
  nodeEnv: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  mongoUri: env.MONGO_URI,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  corsOrigin: env.CORS_ORIGIN
};

console.log('🚀 Backend environment configuration:', backendEnv);