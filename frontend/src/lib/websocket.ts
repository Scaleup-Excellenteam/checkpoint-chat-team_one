import { getWsUrl } from '../config/env';

let ws: WebSocket | null = null;
let messageHandlers: ((message: any) => void)[] = [];
let isConnecting = false;
let connectionAttempts = 0;
// const maxReconnectAttempts = 3;

/**
 * Connect to WebSocket with username
 */
export const connectWebSocket = (
  username: string,
  onError?: (error: Event) => void,
  onClose?: () => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log("🔌 connectWebSocket called with username:", username);
    
    if (isConnecting) {
      console.log("⏳ Already connecting, rejecting...");
      reject(new Error("Already connecting"));
      return;
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log("✅ WebSocket already connected");
      resolve();
      return;
    }

    // Clean up any existing connection
    if (ws) {
      console.log("🧹 Cleaning up existing WebSocket");
      ws.close();
      ws = null;
    }

    try {
      isConnecting = true;
      connectionAttempts++;

      const wsUrl = getWsUrl();
      console.log("🔌 Connecting WebSocket to:", wsUrl, "attempt:", connectionAttempts);

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("✅ WebSocket OPEN");
        isConnecting = false;
        connectionAttempts = 0;

        if (ws && username) {
          const joinMessage = { type: 'join', username, room: 'general' };
          console.log("📤 Sending JOIN:", joinMessage);
          ws.send(JSON.stringify(joinMessage));
        }
        resolve();
      };

      ws.onclose = (event) => {
        console.log("🔌 WebSocket CLOSE:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          readyState: ws?.readyState
        });
        isConnecting = false;
        ws = null;
        onClose?.();
      };

      ws.onerror = (error) => {
        console.error("❌ WebSocket ERROR:", error, "readyState:", ws?.readyState);
        isConnecting = false;
        onError?.(error);
        reject(new Error("WebSocket connection failed"));
      };

      ws.onmessage = (event) => {
        console.log("📨 WebSocket MESSAGE:", event.data);
        try {
          const data = JSON.parse(event.data);
          messageHandlers.forEach(h => h(data));
        } catch (e) {
          console.error("❌ Failed to parse message:", e);
        }
      };
      
    } catch (error) {
      console.error("❌ Error creating WebSocket:", error);
      isConnecting = false;
      reject(error);
    }
  });
};

/**
 * Disconnect WebSocket
 */
export const disconnectWebSocket = () => {
  console.log("🔌 Disconnecting WebSocket");
  
  if (ws) {
    ws.close(1000, "Client disconnecting");
    ws = null;
  }
  
  isConnecting = false;
  messageHandlers = [];
  connectionAttempts = 0;
};

/**
 * Send message through WebSocket
 */
export const sendWebSocketMessage = (message: any): boolean => {
  console.log("📤 Attempting to send WebSocket message:", message);
  
  if (!ws) {
    console.warn("❌ Cannot send message - WebSocket is null");
    return false;
  }
  
  if (ws.readyState !== WebSocket.OPEN) {
    console.warn("❌ Cannot send message - WebSocket not open. State:", ws.readyState);
    console.warn("WebSocket states: CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3");
    return false;
  }
  
  try {
    const messageStr = JSON.stringify(message);
    console.log("📤 Sending WebSocket message string:", messageStr);
    ws.send(messageStr);
    console.log("✅ Message sent successfully");
    return true;
  } catch (error) {
    console.error("❌ Error sending WebSocket message:", error);
    return false;
  }
};

/**
 * Add message handler
 */
export const addMessageHandler = (handler: (message: any) => void) => {
  console.log("➕ Adding message handler");
  messageHandlers.push(handler);
  console.log("📊 Total message handlers:", messageHandlers.length);
};

/**
 * Remove message handler
 */
export const removeMessageHandler = (handler: (message: any) => void) => {
  console.log("➖ Removing message handler");
  const initialLength = messageHandlers.length;
  messageHandlers = messageHandlers.filter(h => h !== handler);
  console.log(`📊 Removed ${initialLength - messageHandlers.length} handlers. Total remaining:`, messageHandlers.length);
};

/**
 * Get WebSocket connection state
 */
export const getWebSocketState = () => {
  return ws ? ws.readyState : WebSocket.CLOSED;
};

/**
 * Check if WebSocket is connected
 */
export const isConnected = (): boolean => {
  const connected = !!ws && ws.readyState === WebSocket.OPEN;
  console.log("🔍 WebSocket connection check:", connected, "State:", ws?.readyState);
  return connected;
};