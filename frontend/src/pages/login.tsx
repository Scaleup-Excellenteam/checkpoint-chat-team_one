// src/pages/login.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { login, type LoginRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { login: doLogin } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const justRegistered = params.get("registered") === "1";

  async function onSubmit(values: FormData) {
    setServerError(null);
    try {
      const response = await login(values as LoginRequest);
      doLogin(response.user);
      navigate("/", { replace: true }); // go to homepage after login
    } catch (e: any) {
      setServerError(e?.response?.data?.message || "Login failed");
    }
  }

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

          {serverError && (
            <div className="alert alert-danger" role="alert">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-semibold">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
            </div>

            {/* Password with show/hide */}
            <div className="mb-3">
              <label htmlFor="password" className="form-label fw-semibold">Password</label>
              <div className="input-group">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <div className="invalid-feedback d-block">{errors.password.message}</div>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              )}
              Sign in
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
