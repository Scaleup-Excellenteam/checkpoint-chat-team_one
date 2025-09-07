import { clientEnv } from '../config/env';

interface WebSocketCallbacks {
  onOpen?: () => void;
  onMessage?: (data: any) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

let socket: WebSocket | null = null;
let callbacks: WebSocketCallbacks = {};

/**
 * Gets or creates a WebSocket connection with the provided callbacks
 */
export function getWebSocket(newCallbacks?: WebSocketCallbacks): WebSocket {
  if (newCallbacks) {
    callbacks = newCallbacks;
  }
  
  // Always close existing connection before creating new one
  if (socket) {
    socket.close();
    socket = null;
  }
  
  const wsUrl = clientEnv.VITE_WS_URL;
  console.log('🔌 Attempting to connect to WebSocket at:', wsUrl);
  
  try {
    socket = new WebSocket(wsUrl);
    
    socket.onopen = (event) => {
      console.log('✅ WebSocket connection established');
      console.log('Connection event:', event);
      if (callbacks.onOpen) callbacks.onOpen();
    };
    
    socket.onmessage = (event) => {
      console.log('📨 WebSocket message received:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('📋 Parsed message:', data);
        if (callbacks.onMessage) callbacks.onMessage(data);
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };
    
    socket.onerror = (event) => {
      console.error('❌ WebSocket error:', event);
      console.error('WebSocket state:', socket?.readyState);
      if (callbacks.onError) callbacks.onError(event);
    };
    
    socket.onclose = (event) => {
      console.log('🔌 WebSocket connection closed:', event.code, event.reason);
      console.log('Clean close:', event.wasClean);
      if (callbacks.onClose) callbacks.onClose(event);
    };
  } catch (error) {
    console.error('❌ Error creating WebSocket:', error);
  }
  
  return socket as WebSocket;
}

/**
 * Sends a message through the WebSocket
 */
export function sendWebSocketMessage(message: any): void {
  if (!socket) {
    console.error('❌ Cannot send message - WebSocket is null');
    return;
  }
  
  if (socket.readyState !== WebSocket.OPEN) {
    console.error('❌ Cannot send message - WebSocket is not open. State:', socket.readyState);
    console.error('WebSocket states: CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3');
    return;
  }
  
  try {
    const messageStr = JSON.stringify(message);
    console.log('📤 Sending WebSocket message:', messageStr);
    socket.send(messageStr);
  } catch (error) {
    console.error('❌ Error sending WebSocket message:', error);
  }
}

/**
 * Closes the WebSocket connection
 */
export function closeWebSocket(): void {
  if (socket) {
    console.log('🔌 Closing WebSocket connection');
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
    socket = null;
  }
}

/**
 * Returns whether the WebSocket is currently connected
 */
export function isConnected(): boolean {
  return !!socket && socket.readyState === WebSocket.OPEN;
}