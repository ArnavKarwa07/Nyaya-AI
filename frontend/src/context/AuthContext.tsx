"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, getApiBaseUrl } from "@/lib/api";

type AuthContextType = {
  userId: string | null;
  accessToken: string | null;
  isAuthReady: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  register: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeAuthError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const data = payload as { detail?: unknown; message?: unknown };

  if (typeof data.detail === "string" && data.detail.trim()) {
    return data.detail;
  }

  if (Array.isArray(data.detail) && data.detail.length > 0) {
    const first = data.detail[0] as { msg?: unknown };
    if (first && typeof first.msg === "string" && first.msg.trim()) {
      return first.msg;
    }
    return fallback;
  }

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  return fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem(AUTH_USER_KEY);
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (storedUserId && storedToken) {
        setUserId(storedUserId);
        setAccessToken(storedToken);
      } else {
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  const login = async (
    username: string,
    password: string,
  ): Promise<string | null> => {
    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserId(data.user_id);
        setAccessToken(data.access_token);
        localStorage.setItem(AUTH_USER_KEY, data.user_id);
        localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
        router.push("/dashboard");
        return null;
      } else {
        const err = await res.json().catch(() => ({}));
        return normalizeAuthError(err, "Login failed");
      }
    } catch {
      return "Could not connect to server";
    }
  };

  const register = async (
    username: string,
    password: string,
  ): Promise<string | null> => {
    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserId(data.user_id);
        setAccessToken(data.access_token);
        localStorage.setItem(AUTH_USER_KEY, data.user_id);
        localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
        router.push("/dashboard");
        return null;
      } else {
        const err = await res.json().catch(() => ({}));
        return normalizeAuthError(err, "Registration failed");
      }
    } catch {
      return "Could not connect to server";
    }
  };

  const logout = () => {
    setUserId(null);
    setAccessToken(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{ userId, accessToken, isAuthReady, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
