import React from "react";

type Conn = "disconnected" | "connecting" | "connected";

interface Props {
  username?: string;
  connectionStatus: Conn;
  onReconnect: () => void;
  onLogout: () => void;
  onShowRooms: () => void;
  onJoinRoom: (room: string) => void;
  onCreateRoom: (room: string) => void;
}

export default function AppNavbar({
  username,
  connectionStatus,
  onReconnect,
  onLogout,
  onShowRooms,
  onJoinRoom,
  onCreateRoom,
}: Props) {
  const handleJoin = () => {
    const name = window.prompt("Enter room name to join:");
    if (name && name.trim()) onJoinRoom(name.trim());
  };

  const handleCreate = () => {
    const name = window.prompt("Enter new room name:");
    if (name && name.trim()) onCreateRoom(name.trim());
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light px-3 mb-3">
      <span className="navbar-brand">Chat App</span>
      <div className="ms-auto d-flex align-items-center gap-2">
        <span className="me-2">
          {username ? `👤 ${username}` : "Not logged in"}
        </span>
        <span
          className={`badge ${
            connectionStatus === "connected"
              ? "bg-success"
              : connectionStatus === "connecting"
              ? "bg-warning text-dark"
              : "bg-danger"
          }`}
        >
          {connectionStatus}
        </span>
        <button className="btn btn-outline-primary btn-sm" onClick={onShowRooms}>
          Rooms
        </button>
        <button className="btn btn-outline-success btn-sm" onClick={handleJoin}>
          Join Room
        </button>
        <button className="btn btn-outline-secondary btn-sm" onClick={handleCreate}>
          Create Room
        </button>
        <button className="btn btn-outline-info btn-sm" onClick={onReconnect}>
          Reconnect
        </button>
        <button className="btn btn-outline-danger btn-sm" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
