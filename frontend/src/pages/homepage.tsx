// src/pages/home.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { chat as chatApi } from "../lib/api"; // add this API in step 2
import { useNavigate } from "react-router-dom";

type Msg = { id: string; role: "user" | "assistant"; content: string };

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => [
    { id: uid(), role: "assistant", content: "Hi! I'm your chatbot. How can I help?" },
  ]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const historyForApi = useMemo(
    () => messages.map(m => ({ role: m.role, content: m.content })),
    [messages]
  );

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Msg = { id: uid(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Call your backend (POST /api/chat)
      const res = await chatApi({ message: text, history: historyForApi });
      const assistantMsg: Msg = { id: uid(), role: "assistant", content: res.reply };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      // Friendly fallback if backend isn't running yet
      const assistantMsg: Msg = {
        id: uid(),
        role: "assistant",
        content:
          "I couldn't reach the chat API. For now I'll echo your message: " + text,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 m-0">Welcome{user?.name ? `, ${user.name}` : ""}</h1>
        <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
          Log out
        </button>
      </div>

      <div className="card shadow-sm rounded-4">
        <div className="card-header bg-white">
          <strong>Chatbot</strong>
        </div>

        {/* Messages */}
        <div
          className="card-body"
          style={{ height: "60vh", overflowY: "auto", background: "#f8f9fa" }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`d-flex mb-2 ${m.role === "user" ? "justify-content-end" : "justify-content-start"}`}
            >
              <div
                className={`p-2 rounded-3 ${
                  m.role === "user" ? "bg-primary text-white" : "bg-light border"
                }`}
                style={{ maxWidth: "75%" }}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="card-footer bg-white">
          <form onSubmit={handleSend} className="input-group">
            <input
              className="form-control"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) handleSend(e);
              }}
              disabled={loading}
            />
            <button className="btn btn-primary" type="submit" disabled={!input.trim() || loading}>
              {loading && (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              )}
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
