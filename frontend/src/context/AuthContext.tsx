"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  userId: string | null;
  login: (username: string, password: string) => Promise<string | null>;
  register: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUserId = localStorage.getItem('nyaya_user_id');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const login = async (username: string, password: string): Promise<string | null> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUserId(data.user_id);
        localStorage.setItem('nyaya_user_id', data.user_id);
        router.push('/dashboard');
        return null;
      } else {
        const err = await res.json();
        return err.detail || "Login failed";
      }
    } catch {
      return "Could not connect to server";
    }
  };

  const register = async (username: string, password: string): Promise<string | null> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUserId(data.user_id);
        localStorage.setItem('nyaya_user_id', data.user_id);
        router.push('/dashboard');
        return null;
      } else {
        const err = await res.json();
        return err.detail || "Registration failed";
      }
    } catch {
      return "Could not connect to server";
    }
  };

  const logout = () => {
    setUserId(null);
    localStorage.removeItem('nyaya_user_id');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ userId, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
