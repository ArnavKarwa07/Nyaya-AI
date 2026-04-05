"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { userId, accessToken, isAuthReady, login, register } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }
    if (userId && accessToken) {
      router.replace("/dashboard");
    }
  }, [isAuthReady, userId, accessToken, router]);

  const onSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please fill in username and password");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const err = isRegisterMode
      ? await register(username.trim(), password)
      : await login(username.trim(), password);

    if (err) {
      setError(err);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="landing-hero" style={{ minHeight: "100vh" }}>
      <div className="hero-content" style={{ maxWidth: "36rem" }}>
        <div className="hero-badge">
          <span className="material-symbols-outlined">lock</span>
          Secure Workspace Access
        </div>
        <h1 className="hero-title">
          {isRegisterMode ? "Create Account" : "Login"}
        </h1>
        <p className="hero-subtitle">
          {isRegisterMode
            ? "Use a strong password with uppercase, lowercase, number, and special character."
            : "Sign in to access documents, AI research, and dashboard features."}
        </p>

        <div
          className="auth-form-card"
          style={{
            maxWidth: "100%",
            border: "1px solid var(--color-outline-variant)",
            background: "var(--color-surface-container-lowest)",
          }}
        >
          {error && <p className="auth-error">{error}</p>}

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="input-field auth-input"
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input-field auth-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSubmit();
              }
            }}
          />

          <button
            className="btn-primary auth-submit-btn"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Please wait..."
              : isRegisterMode
                ? "Create Account"
                : "Login"}
          </button>

          <div className="auth-toggle-row">
            <button
              onClick={() => {
                setIsRegisterMode((prev) => !prev);
                setError(null);
              }}
              className="btn-text-muted"
            >
              {isRegisterMode
                ? "Already have an account? Login"
                : "No account? Register"}
            </button>
            <Link href="/" className="btn-text-muted">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
