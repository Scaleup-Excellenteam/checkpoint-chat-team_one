// src/pages/login.tsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const justRegistered = params.get("registered") === "1";
  const { login: doLogin, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login form submitted");
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      console.log("Calling doLogin...");
      await doLogin(email, password);
      console.log("Login successful, navigating...");
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <main className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary">
      <div className="card shadow-sm rounded-4" style={{ maxWidth: 420, width: "100%" }}>
        <div className="card-body p-4 p-md-5">
          <h1 className="h3 text-center mb-2">Sign in</h1>
          <p className="text-center text-secondary mb-4">
            Welcome back. Please enter your details.
          </p>

          {justRegistered && (
            <div className="alert alert-success" role="alert">
              Account created. Please sign in.
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-semibold">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="mb-3">
              <label htmlFor="password" className="form-label fw-semibold">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Sign in"}
            </button>

            <div className="text-center mt-3">
              <small>
                Don’t have an account? <Link to="/register">Create one</Link>
              </small>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
