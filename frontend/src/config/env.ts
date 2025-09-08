export const clientEnv = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_WS_URL: import.meta.env.VITE_WS_URL,
};

export const getWsUrl = (): string => {
  if (clientEnv.VITE_WS_URL) return clientEnv.VITE_WS_URL as string;
  try {
    const api = new URL((clientEnv.VITE_API_URL as string) || 'http://localhost:5000/api');
    const proto = api.protocol === 'https:' ? 'wss:' : 'ws:';
    const base = api.pathname.replace(/\/api\/?$/, '/');
    return `${proto}//${api.host}${base}`;
  } catch {
    const loc = window.location;
    const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${loc.hostname}:5000/`;
  }
};

// Debug
console.log('Environment variables loaded:');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('VITE_WS_URL:', import.meta.env.VITE_WS_URL);
console.log('Final config:', { ws: getWsUrl() });