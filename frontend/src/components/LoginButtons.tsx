"use client";

import React from "react";
import Link from "next/link";

import { useAuth } from "@/context/AuthContext";

export default function LoginButtons() {
  const { userId, accessToken, isAuthReady, logout } = useAuth();

  if (!isAuthReady) {
    return null;
  }

  if (userId && accessToken) {
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

  return (
    <Link href="/login" className="btn-primary">
      Login
    </Link>
  );
}
