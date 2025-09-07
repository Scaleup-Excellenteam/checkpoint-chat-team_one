// src/pages/home.tsx
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getWebSocket, closeWebSocket, sendWebSocketMessage } from '../lib/websocket';

interface Message {
  type: string;
  username: string;
  content: string;
  timestamp: string;
  room?: string;
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true); // Start loading
  const [roomJoined, setRoomJoined] = useState(false);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  // AUTO-RESET LOADING STATE AFTER 5 SECONDS AS SAFETY MEASURE
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.log("⚠️ Safety timeout: Resetting loading state");
        setLoading(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loading]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket connection setup
  useEffect(() => {
    console.log('🔄 HomePage useEffect triggered');
    console.log('🔄 User:', user);
    console.log('🔄 User username:', user?.username);
    
    if (!user?.username) {
      console.log('❌ No user username, skipping WebSocket connection');
      return;
    }
    
    console.log('✅ Attempting to create WebSocket connection...');
    
    // Increment connection attempts
    setConnectionAttempts(prev => prev + 1);
    console.log(`🔄 Connection attempt #${connectionAttempts + 1}`);
    
    getWebSocket({
      onOpen: () => {
        console.log("✅ WebSocket connected in HomePage");
        
        // IMPORTANT: Don't set loading=false here, wait for room join confirmation
        
        // Try to join the room
        console.log(`🚪 Attempting to join room as ${user.username}`);
        sendWebSocketMessage({
          type: 'join',
          username: user.username,
          room: "general"
        });
        
        // Safety timeout for room join
        setTimeout(() => {
          if (!roomJoined) {
            console.log("⚠️ Room join timeout - forcing retry");
            setLoading(false);
            sendWebSocketMessage({
              type: 'join',
              username: user.username,
              room: "general"
            });
          }
        }, 3000);
      },
      
      onMessage: (data) => {
        console.log("📨 Received:", data);
        
        if (data.type === "message") {
          console.log("💬 Chat message received");
          const newMessage: Message = {
            type: data.type,
            username: data.username || "Unknown",
            content: data.content || "",
            timestamp: data.timestamp || new Date().toISOString()
          };
          
          setMessages(prev => [...prev, newMessage]);
        } 
        else if (data.type === "system") {
          console.log("🔔 System message:", data.message);
          
          // IMPORTANT: THIS IS WHERE WE CONFIRM ROOM JOIN
          if (data.message?.includes("Joined room")) {
            console.log("✅ Room joined successfully");
            setRoomJoined(true);
            setLoading(false);
          }
        }
        else if (data.type === "connected") {
          console.log("🔌 Connected message received");
          // Some servers send a confirmation on connect
          // We don't set roomJoined here, but we ensure loading is reset
          setLoading(false);
        }
        else if (data.type === "error") {
          console.error("❌ Error:", data.message);
          // Always reset loading on error
          setLoading(false);
          
          if (data.message === "Join a room first") {
            console.log("🔄 Retry joining room");
            sendWebSocketMessage({
              type: 'join',
              username: user.username,
              room: "general"
            });
          }
        }
      },
      
      onError: (event) => {
        console.error("❌ WebSocket error", event);
        // Always reset loading on error
        setLoading(false);
        setRoomJoined(false);
      },
      
      onClose: () => {
        console.log("🔌 WebSocket closed");
        // Always reset loading on close
        setLoading(false);
        setRoomJoined(false);
      }
    });
    
    return () => closeWebSocket();
  }, [user?.username, connectionAttempts]); // Add connectionAttempts to retry on failure
  
  // Process queued messages when room is joined
  useEffect(() => {
    if (roomJoined && messageQueue.length > 0) {
      console.log("📤 Sending queued messages:", messageQueue);
      
      messageQueue.forEach(content => {
        sendWebSocketMessage({
          type: 'message',
          content
        });
      });
      
      setMessageQueue([]);
    }
  }, [roomJoined, messageQueue]);
  
  // Manual reconnect function
  const handleReconnect = () => {
    setLoading(true);
    setConnectionAttempts(prev => prev + 1); // This will trigger the useEffect
  };
  
  // Send a message
  const sendMessage = (content: string) => {
    if (!content.trim()) return;
    
    if (!roomJoined) {
      console.log("🚫 Room not joined, queuing message");
      setMessageQueue(prev => [...prev, content]);
      
      if (user?.username) {
        sendWebSocketMessage({
          type: 'join',
          username: user.username,
          room: "general"
        });
      }
      return;
    }
    
    console.log("📤 Sending message:", content);
    setLoading(true);
    
    sendWebSocketMessage({
      type: 'message',
      content
    });
    
    // Ensure spinner doesn't stay forever
    setTimeout(() => setLoading(false), 1000);
  };
  
  // Handle form submission
  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    
    sendMessage(input);
    setInput("");
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };
  
  // Add extensive auth debugging
  console.log('🔍 HomePage - Auth State Debug:');
  console.log('🔍 User object:', user);
  console.log('🔍 User type:', typeof user);
  console.log('🔍 User keys:', user ? Object.keys(user) : 'null');
  console.log('🔍 Is user truthy?', !!user);
  
  // Also check if you should redirect to login
  useEffect(() => {
    if (!user) {
      console.log('🚨 No user found, should redirect to login');
      // Uncomment the next line if you want automatic redirect
      // navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  return (
    <main className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 m-0">Welcome, {user?.username}</h1>
        <div>
          <button 
            className="btn btn-outline-secondary btn-sm me-2" 
            onClick={handleReconnect} 
            disabled={loading}
          >
            🔄 Reconnect
          </button>
          <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <strong>Chat Room: general</strong>
          <span className={`badge ${roomJoined ? "bg-success" : loading ? "bg-warning" : "bg-danger"}`}>
            {roomJoined ? "Connected" : loading ? "Connecting..." : "Disconnected"}
          </span>
        </div>
        
        <div className="card-body" style={{ height: "400px", overflowY: "auto" }}>
          {messages.length === 0 ? (
            <div className="text-center text-muted py-5">
              {loading ? "Connecting..." : roomJoined ? "No messages yet" : "Not connected to chat"}
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`mb-3 ${msg.username === user?.username ? 'text-end' : ''}`}>
                <div 
                  className={`d-inline-block p-2 rounded-3 ${
                    msg.username === user?.username 
                      ? 'bg-primary text-white' 
                      : 'bg-light'
                  }`}
                  style={{ maxWidth: "75%" }}
                >
                  {msg.username !== user?.username && (
                    <div className="fw-bold mb-1">{msg.username}</div>
                  )}
                  <div>{msg.content}</div>
                  <div className={`small ${msg.username === user?.username ? 'text-white-50' : 'text-muted'} mt-1`}>
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
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" />
              ) : (
                'Send'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
