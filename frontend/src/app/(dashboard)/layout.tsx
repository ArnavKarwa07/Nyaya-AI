"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { userId, accessToken, isAuthReady } = useAuth();

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }
    if (!userId || !accessToken) {
      router.replace("/login");
    }
  }, [isAuthReady, userId, accessToken, router]);

  if (!isAuthReady || !userId || !accessToken) {
    return (
      <div className="empty-state" style={{ minHeight: "100vh" }}>
        <span className="material-symbols-outlined empty-icon">lock</span>
        <p className="empty-text">Checking your session...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <Sidebar />
      <div className="dashboard-main">
        <Header />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
