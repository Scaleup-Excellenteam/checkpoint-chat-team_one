import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Only load .env file in development. In Docker, variables are passed directly.
if (process.env.NODE_ENV !== 'production') {
  // For local dev, load .env from the project root, which is 3 levels up
  // from this file's directory (/backend/src/config)
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

const envSchema = z.object({
  // The backend container doesn't need the frontend port
  BACK_END_PORT: z.coerce.number().int().positive().default(3000),
  WS_PORT: z.coerce.number().int().positive().default(8080),
  MONGO_URI: z.string().min(1, { message: "MONGO_URI is required." }),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsedEnv.error.flatten().fieldErrors,
  );
  throw new Error("Invalid environment variables.");
}

export const env = parsedEnv.data;