export const clientEnv = {
  VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  VITE_WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:5000',
} as const;

// Debug log to verify environment variables are loaded
console.log('Environment variables loaded:');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('VITE_WS_URL:', import.meta.env.VITE_WS_URL);
console.log('Final config:', clientEnv);