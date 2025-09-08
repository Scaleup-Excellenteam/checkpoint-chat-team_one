// src/pages/HomePage.tsx
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  connectWebSocket,
  disconnectWebSocket,
  sendWebSocketMessage,
  addMessageHandler,
  removeMessageHandler,
  isConnected,
} from "../lib/websocket";
import AppNavbar from "../components/AppNavbar";
import { RoomsAPI, type Room } from "../lib/rooms";

interface Message {
  _id?: string;
  content: string;
  username: string;
  timestamp: string | Date;
  room?: string;         // room name (display)
  roomId?: string;       // optional room id
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const bottomRef = useRef<HTMLDivElement>(null);
  const cleanupTimerRef = useRef<number | null>(null);
  const connectionAttemptRef = useRef(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [error, setError] = useState<string>("");

  // Rooms state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showRoomsPanel, setShowRoomsPanel] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string>("general"); // room name

  // WebSocket message handler
  const handleWebSocketMessage = useRef((data: any) => {
    console.log("📨 WS message:", data);

    switch (data.type) {
      case "message": {
        setMessages((prev) => [
          ...prev,
          {
            content: data.content,
            username: data.username,
            timestamp: data.timestamp || new Date().toISOString(),
            room: data.room ?? currentRoom,
            roomId: data.roomId,
            _id: data._id || `msg-${Date.now()}-${Math.random()}`,
          },
        ]);
        break;
      }

      // Server confirms initial join
      case "join": {
        setConnectionStatus("connected");
        setError("");
        if (data.room) setCurrentRoom(data.room);
        break;
      }

      // Server confirms we joined a specific room
      case "joined_room": {
        const rName = data.room ?? currentRoom;
        setCurrentRoom(rName);
        setMessages((prev) => [
          ...prev,
          {
            content: `You joined room "${rName}"`,
            username: "System",
            timestamp: data.timestamp || new Date().toISOString(),
            room: rName,
            roomId: data.roomId,
            _id: `system-${Date.now()}`,
          },
        ]);
        break;
      }

      case "user_joined": {
        setMessages((prev) => [
          ...prev,
          {
            content: `${data.username} joined the chat`,
            username: "System",
            timestamp: data.timestamp || new Date().toISOString(),
            room: data.room ?? currentRoom,
            _id: `system-${Date.now()}`,
          },
        ]);
        break;
      }

      case "user_left": {
        setMessages((prev) => [
          ...prev,
          {
            content: `${data.username} left the chat`,
            username: "System",
            timestamp: data.timestamp || new Date().toISOString(),
            room: data.room ?? currentRoom,
            _id: `system-${Date.now()}`,
          },
        ]);
        break;
      }

      case "error": {
        setError(data.content || data.message || "WebSocket error");
        break;
      }

      default:
        console.log("🤷 Unhandled WS type:", data.type);
    }
  });

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket lifecycle (single connection attempt)
  useEffect(() => {
    if (!user?.username) {
      navigate("/login", { replace: true });
      return;
    }

    // cancel any pending cleanup (StrictMode)
    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);

    if (connectionAttemptRef.current) return;
    connectionAttemptRef.current = true;

    setConnectionStatus("connecting");
    setError("");

    addMessageHandler(handleWebSocketMessage.current);

    connectWebSocket(
      user.username,
      () => {
        // onClose
        setConnectionStatus("disconnected");
        connectionAttemptRef.current = false;
      },
      () => {
        // onError
        setConnectionStatus("disconnected");
        connectionAttemptRef.current = false;
      }
    ).catch(() => setConnectionStatus("disconnected"));

    // deferred cleanup to avoid immediate disconnect in StrictMode
    return () => {
      cleanupTimerRef.current = window.setTimeout(() => {
        removeMessageHandler(handleWebSocketMessage.current);
        disconnectWebSocket();
        connectionAttemptRef.current = false;
      }, 300);
    };
  }, [user?.username, navigate]);

  // Manual reconnect
  const handleReconnect = () => {
    setError("");
    connectionAttemptRef.current = false;
    setConnectionStatus("disconnected");
    disconnectWebSocket();
    // useEffect will re-run and reconnect
  };

  // Send a message
  const sendMessage = (content: string) => {
    if (!content.trim()) return;
    if(content.length > 250) {
      setError("Message exceeds 250 character limit");
      return;
    }

    if (!isConnected()) {
      setError("Not connected to chat server");
      return;
    }

    const roomObj = rooms.find((r) => r.name === currentRoom);
    const payload = {
      type: "message",
      content: content.trim(),
      room: currentRoom,
      ...(roomObj?._id ? { roomId: roomObj._id } : {}),
    };

    const ok = sendWebSocketMessage(payload);
    if (!ok) setError("Failed to send message");
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    if (connectionStatus !== "connected") return;
    sendMessage(input);
    setInput("");
  };

  // Logout
  const handleLogout = () => {
    disconnectWebSocket();
    logout();
    navigate("/login", { replace: true });
  };

  // -------- Rooms (REST) --------
  const handleShowRooms = async () => {
    try {
      const list = await RoomsAPI.getAll();
      setRooms(list);
      setShowRoomsPanel(true);
    } catch (e: any) {
      setError(e.message || "Failed to load rooms");
    }
  };

  const handleCreateRoom = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const created = await RoomsAPI.create(trimmed, user!.username);
      setRooms((prev) =>
        prev.find((r) => r._id === created._id) ? prev : [created, ...prev]
      );
      setShowRoomsPanel(true);
      // אם תרצה להצטרף אוטומטית מיד אחרי יצירה, בטל הערה על השורה הבאה:
      // await handleJoinRoom(created);
    } catch (e: any) {
      setError(e.message || "Failed to create room");
    }
  };

  const handleJoinRoom = async (roomOrName: string | Room) => {
    try {
      let room: Room | undefined;

      if (typeof roomOrName === "string") {
        const targetName = roomOrName.trim();
        room = rooms.find((r) => r.name === targetName);

        if (!room) {
          // Refresh list then try again
          const fresh = await RoomsAPI.getAll();
          setRooms(fresh);
          room = fresh.find((r: Room) => r.name === targetName);
        }
      } else {
        room = roomOrName;
      }

      if (!room) {
        setError("Room not found");
        return;
      }

      setCurrentRoom(room.name);
      setShowRoomsPanel(false);

      if (!isConnected()) {
        setError("Not connected to chat server");
        return;
      }

  // Ask WS server to join room by id (and pass name as fallback, and include username)
  sendWebSocketMessage({ type: "join", roomId: room._id, room: room.name, username: user?.username });
    } catch (e: any) {
      setError(e.message || "Failed to join room");
    }
  };

  // Debug logs
  console.log("🔍 HomePage - conn:", connectionStatus, "room:", currentRoom, "msgs:", messages.length);

  return (
    <>
      <AppNavbar
        username={user?.username}
        connectionStatus={connectionStatus}
        onReconnect={handleReconnect}
        onLogout={handleLogout}
        onShowRooms={handleShowRooms}
        onJoinRoom={(name) => handleJoinRoom(name)}  // from prompt in navbar
        onCreateRoom={handleCreateRoom}
      />

      <main className="container py-3">
        {error && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center">
            <span>{error}</span>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-primary" onClick={handleReconnect}>
                Try Again
              </button>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setError("")}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Rooms Panel */}
        {showRoomsPanel && (
          <div className="card shadow-sm mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <strong>Available Rooms</strong>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={handleShowRooms}
                  title="Refresh list"
                >
                  🔄 Refresh
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowRoomsPanel(false)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="card-body" style={{ maxHeight: 260, overflowY: "auto" }}>
              {rooms.length === 0 ? (
                <div className="text-muted">No rooms found.</div>
              ) : (
                <ul className="list-group">
                  {rooms.map((r) => (
                    <li
                      key={r._id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div className="d-flex flex-column">
                        <span className="fw-medium">{r.name}</span>
                        <small className="text-muted">{r._id}</small>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => handleJoinRoom(r)}
                      >
                        Join
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Chat Card */}
        <div className="card shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center">
            <strong>Chat Room: {currentRoom}</strong>
            <span
              className={`badge ${
                connectionStatus === "connected"
                  ? "bg-success"
                  : connectionStatus === "connecting"
                  ? "bg-warning text-dark"
                  : "bg-danger"
              }`}
            >
              {connectionStatus === "connected"
                ? "Connected"
                : connectionStatus === "connecting"
                ? "Connecting..."
                : "Disconnected"}
            </span>
          </div>

          <div className="card-body" style={{ height: "400px", overflowY: "auto" }}>
            {messages.filter((m) => !m.room || m.room === currentRoom).length === 0 ? (
              <div className="text-center text-muted py-5">
                {connectionStatus === "connecting"
                  ? "Connecting..."
                  : connectionStatus === "connected"
                  ? "No messages yet. Start the conversation!"
                  : "Not connected to chat"}
              </div>
            ) : (
              messages
                .filter((m) => !m.room || m.room === currentRoom)
                .map((msg, index) => (
                  <div
                    key={msg._id || index}
                    className={`mb-3 ${msg.username === user?.username ? "text-end" : ""}`}
                  >
                    <div
                      className={`d-inline-block p-2 rounded-3 ${
                        msg.username === "System"
                          ? "bg-secondary text-white"
                          : msg.username === user?.username
                          ? "bg-primary text-white"
                          : "bg-light"
                      }`}
                      style={{ maxWidth: "75%" }}
                    >
                      {msg.username !== user?.username && msg.username !== "System" && (
                        <div className="fw-bold mb-1">{msg.username}</div>
                      )}
                      <div>{msg.content}</div>
                      <div
                        className={`small ${
                          msg.username === user?.username || msg.username === "System"
                            ? "text-white-50"
                            : "text-muted"
                        } mt-1`}
                      >
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
                placeholder={
                  connectionStatus === "connected" ? `Message #${currentRoom}` : "Connecting..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={connectionStatus !== "connected"}
                maxLength={250}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!input.trim() || connectionStatus !== "connected"}
              >
                Send
              </button>
            </form>
            {connectionStatus !== "connected" && (
              <small className="text-muted">Connect to the chat to send messages</small>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
