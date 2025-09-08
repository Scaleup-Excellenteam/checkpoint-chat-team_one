// src/pages/home.tsx
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  connectWebSocket, 
  disconnectWebSocket, 
  sendWebSocketMessage, 
  addMessageHandler, 
  removeMessageHandler,
  isConnected
} from '../lib/websocket';

interface Message {
  _id?: string;
  content: string;
  username: string;
  timestamp: string | Date;
  room?: string;
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const cleanupTimerRef = useRef<number | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [error, setError] = useState<string>("");
  
  // Single connection attempt tracker
  const connectionAttemptRef = useRef(false);
  
  // Message handler for WebSocket
  const handleWebSocketMessage = useRef((data: any) => {
    console.log("📨 HomePage received message:", data);
    switch (data.type) {
      case 'message':
        setMessages(prev => [...prev, {
          content: data.content,
          username: data.username,
          timestamp: data.timestamp || new Date().toISOString(),
          _id: data._id || `msg-${Date.now()}-${Math.random()}`
        }]);
        break;
      case 'join':
        setConnectionStatus('connected');
        setError("");
        break;
      case 'user_joined':
        setMessages(prev => [...prev, {
          content: `${data.username} joined the chat`,
          username: 'System',
          timestamp: data.timestamp || new Date().toISOString(),
          _id: `system-${Date.now()}`
        }]);
        break;
      case 'user_left':
        setMessages(prev => [...prev, {
          content: `${data.username} left the chat`,
          username: 'System',
          timestamp: data.timestamp || new Date().toISOString(),
          _id: `system-${Date.now()}`
        }]);
        break;
      case 'error':
        setError(data.content || data.message || "WebSocket error");
        break;
      default:
        console.log("🤷 Unhandled WS type:", data.type);
        break;
    }
  });
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Single WebSocket connection setup
  useEffect(() => {
    if (!user?.username) {
      navigate('/login', { replace: true });
      return;
    }

    // Cancel any pending strict-mode cleanup timer
    cleanupTimerRef.current && clearTimeout(cleanupTimerRef.current);

    if (connectionAttemptRef.current) return;
    connectionAttemptRef.current = true;
    setConnectionStatus('connecting');
    setError("");

    addMessageHandler(handleWebSocketMessage.current);

    connectWebSocket(
      user.username,
      () => { setConnectionStatus('disconnected'); connectionAttemptRef.current = false; },
      () => { setConnectionStatus('disconnected'); connectionAttemptRef.current = false; }
    ).then(() => {
      // connected -> wait for 'join' to mark as connected
    }).catch(() => {
      setConnectionStatus('disconnected');
    });

    // Defer cleanup to avoid StrictMode immediate disconnect
    return () => {
      cleanupTimerRef.current = window.setTimeout(() => {
        removeMessageHandler(handleWebSocketMessage.current);
        disconnectWebSocket();
        connectionAttemptRef.current = false;
      }, 300);
    };
  }, [user?.username, navigate]);

  // Manual reconnect function
  const handleReconnect = () => {
    setError("");
    connectionAttemptRef.current = false;
    setConnectionStatus('disconnected');
    disconnectWebSocket();
    // The useEffect will handle reconnection when connectionAttemptRef becomes false
  };
  
  // Send a message
  const sendMessage = (content: string) => {
    if (!content.trim()) {
      console.log("❌ Cannot send empty message");
      return;
    }
    
    if (!isConnected()) {
      console.log("❌ Not connected, cannot send message");
      setError("Not connected to chat server");
      return;
    }
    
    console.log("📤 Preparing to send message:", content);
    
    const messageData = {
      type: 'message',
      content: content.trim()
    };
    
    console.log("📤 Sending message data:", messageData);
    
    const success = sendWebSocketMessage(messageData);
    
    if (!success) {
      console.error("❌ Failed to send message");
      setError("Failed to send message");
    } else {
      console.log("✅ Message sent successfully");
    }
  };
  
  // Handle form submission
  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    console.log("📝 Form submitted with input:", input);
    console.log("📊 Connection status:", connectionStatus);
    console.log("📊 Is connected:", isConnected());
    
    if (!input.trim()) {
      console.log("❌ Input is empty");
      return;
    }
    
    if (connectionStatus !== 'connected') {
      console.log("❌ Not connected, status:", connectionStatus);
      return;
    }
    
    sendMessage(input);
    setInput("");
  };
  
  // Handle logout
  const handleLogout = () => {
    disconnectWebSocket();
    logout();
    navigate("/login", { replace: true });
  };

  // Debug info
  console.log("🔍 HomePage render - Connection status:", connectionStatus);
  console.log("🔍 HomePage render - Messages count:", messages.length);
  console.log("🔍 HomePage render - Current input:", input);

  return (
    <main className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 m-0">Welcome, {user?.username}</h1>
        <div>
          <button 
            className="btn btn-outline-secondary btn-sm me-2" 
            onClick={handleReconnect} 
            disabled={connectionStatus === 'connecting'}
          >
            🔄 Reconnect
          </button>
          <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger">
          {error}
          <button 
            className="btn btn-sm btn-outline-primary ms-2"
            onClick={handleReconnect}
          >
            Try Again
          </button>
        </div>
      )}
      
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <strong>Chat Room: general</strong>
          <span className={`badge ${
            connectionStatus === 'connected' ? "bg-success" : 
            connectionStatus === 'connecting' ? "bg-warning" : "bg-danger"
          }`}>
            {connectionStatus === 'connected' ? "Connected" : 
             connectionStatus === 'connecting' ? "Connecting..." : "Disconnected"}
          </span>
        </div>
        
        <div className="card-body" style={{ height: "400px", overflowY: "auto" }}>
          {messages.length === 0 ? (
            <div className="text-center text-muted py-5">
              {connectionStatus === 'connecting' ? "Connecting..." : 
               connectionStatus === 'connected' ? "No messages yet. Start the conversation!" : "Not connected to chat"}
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={msg._id || index} className={`mb-3 ${msg.username === user?.username ? 'text-end' : ''}`}>
                <div 
                  className={`d-inline-block p-2 rounded-3 ${
                    msg.username === 'System' ? 'bg-secondary text-white' :
                    msg.username === user?.username 
                      ? 'bg-primary text-white' 
                      : 'bg-light'
                  }`}
                  style={{ maxWidth: "75%" }}
                >
                  {msg.username !== user?.username && msg.username !== 'System' && (
                    <div className="fw-bold mb-1">{msg.username}</div>
                  )}
                  <div>{msg.content}</div>
                  <div className={`small ${msg.username === user?.username || msg.username === 'System' ? 'text-white-50' : 'text-muted'} mt-1`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
        
        <div className="card-footer">
          <form onSubmit={handleSend} className="d-flex">
            <input
              type="text"
              className="form-control me-2"
              placeholder={connectionStatus === 'connected' ? "Type a message..." : "Connecting..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={connectionStatus !== 'connected'}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!input.trim() || connectionStatus !== 'connected'}
            >
              Send
            </button>
          </form>
          {connectionStatus !== 'connected' && (
            <small className="text-muted">
              Connect to the chat to send messages
            </small>
          )}
        </div>
      </div>
    </main>
  );
}
