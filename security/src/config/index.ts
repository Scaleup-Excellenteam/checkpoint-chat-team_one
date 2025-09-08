import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file
dotenvConfig({ path: join(__dirname, '../../.env') });

// Export configuration settings
export const PORT = process.env.PORT || 3000;
export const DB_URI = process.env.DB_URI || 'mongodb://localhost:27017/myapp';
export const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';