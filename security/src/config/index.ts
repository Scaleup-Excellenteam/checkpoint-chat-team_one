import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file
dotenvConfig({ path: join(__dirname, '../../.env') });

// Export configuration settings
