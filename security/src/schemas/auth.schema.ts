import { z } from 'zod';

export const AuthSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(100),
});

export type AuthData = z.infer<typeof AuthSchema>;