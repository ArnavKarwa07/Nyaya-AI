"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginButtons() {
  const { userId, login, register, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (userId) {
    return (
      <div className="login-group">
        <Link href="/dashboard" className="btn-primary">
          Dashboard
        </Link>
        <button onClick={logout} className="btn-text">
          Logout ({userId})
        </button>
      </div>
    );
  }

  if (isLoggingIn) {
    const handleSubmit = async () => {
      if (!username.trim() || !password.trim()) {
        setError("Please fill in both fields");
        return;
      }
      setIsSubmitting(true);
      setError(null);

      const err = isRegisterMode
        ? await register(username, password)
        : await login(username, password);

      if (err) {
        setError(err);
        setIsSubmitting(false);
      }
    };

    return (
      <div className="auth-form-container">
        <div className="auth-form-card">
          <h3 className="auth-form-title">{isRegisterMode ? "Create Account" : "Welcome Back"}</h3>
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
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary auth-submit-btn"
          >
            {isSubmitting ? "..." : (isRegisterMode ? "Register" : "Log In")}
          </button>
          <div className="auth-toggle-row">
            <button
              onClick={() => { setIsRegisterMode(!isRegisterMode); setError(null); }}
              className="btn-text-muted"
            >
              {isRegisterMode ? "Already have an account? Log In" : "No account? Register"}
            </button>
            <button onClick={() => { setIsLoggingIn(false); setError(null); }} className="btn-text-muted">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setIsLoggingIn(true)} className="btn-primary">
      Log In
    </button>
  );
}
