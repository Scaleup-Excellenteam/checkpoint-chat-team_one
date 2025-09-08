export const clientEnv = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_WS_URL: import.meta.env.VITE_WS_URL,
};

// Dynamically determine the API and WebSocket URLs based on the current location
const getApiBaseUrl = (): string => {
  if (clientEnv.VITE_API_URL) return clientEnv.VITE_API_URL as string;
  
  // If no explicit API URL, use the same hostname but port 5000
  const loc = window.location;
  return `${loc.protocol}//${loc.hostname}:5000`;
};

// Export for use in other files
export const getApiUrl = getApiBaseUrl;

export const getWsUrl = (): string => {
  if (clientEnv.VITE_WS_URL) return clientEnv.VITE_WS_URL as string;
  
  // If no explicit WebSocket URL, derive from the API URL
  try {
    const apiUrl = getApiBaseUrl();
    const url = new URL(apiUrl);
    const proto = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${url.host}`;
  } catch {
    const loc = window.location;
    const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${loc.hostname}:5000`;
  }
};

// Debug
console.log('Environment variables loaded:');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('VITE_WS_URL:', import.meta.env.VITE_WS_URL);
console.log('Final config:', { ws: getWsUrl() });