// src/pages/register.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { register as registerApi, type RegisterRequest } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";

const schema = z.object({
  name: z.string().min(2, "Name is required").max(50, "Name is too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm: z.string().min(6, "Please confirm your password"),
}).refine((v) => v.password === v.confirm, {
  path: ["confirm"],
  message: "Passwords do not match",
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(values: FormData) {
    setServerError(null);
    setLoading(true);
    try {
      const payload: RegisterRequest = {
        username: values.name,
        email: values.email,
        password: values.password,
      };
      await registerApi(payload);

      // Always send the user to login after successful registration
      navigate("/login?registered=1", { replace: true });
    } catch (e: any) {
      setServerError(e?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary">
      <div className="card shadow-sm rounded-4" style={{ maxWidth: 480, width: "100%" }}>
        <div className="card-body p-4 p-md-5">
          <h1 className="h3 text-center mb-2">Create account</h1>
          <p className="text-center text-secondary mb-4">
            Join us by filling in your details.
          </p>

          {serverError && (
            <div className="alert alert-danger" role="alert">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Name */}
            <div className="mb-3">
              <label htmlFor="name" className="form-label fw-semibold">Name</label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                className={`form-control ${errors.name ? "is-invalid" : ""}`}
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
            </div>

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

            {/* Password */}
            <div className="mb-3">
              <label htmlFor="password" className="form-label fw-semibold">Password</label>
              <div className="input-group">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPwd((s) => !s)}
                >
                  {showPwd ? "Hide" : "Show"}
                </button>
                {errors.password && <div className="invalid-feedback d-block">{errors.password.message}</div>}
              </div>
            </div>

            {/* Confirm */}
            <div className="mb-4">
              <label htmlFor="confirm" className="form-label fw-semibold">Confirm password</label>
              <div className="input-group">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`form-control ${errors.confirm ? "is-invalid" : ""}`}
                  aria-invalid={!!errors.confirm}
                  {...register("confirm")}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowConfirm((s) => !s)}
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
                {errors.confirm && <div className="invalid-feedback d-block">{errors.confirm.message}</div>}
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />}
              Create account
            </button>

            <div className="text-center mt-3">
              <small>
                Already have an account? <Link to="/login">Sign in</Link>
              </small>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
