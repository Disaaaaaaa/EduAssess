"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";
import { Menu, X, GraduationCap } from "lucide-react";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [showRetry, setShowRetry] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !session) {
      router.push("/auth/login");
    }
  }, [session, loading, router]);

  // If loading takes more than 5 seconds, show a retry hint
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setShowRetry(true), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowRetry(false);
    }
  }, [loading]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
        }}
      >
        <div style={{ textAlign: "center", padding: 20 }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p style={{ marginTop: 16, color: "var(--text-secondary)", fontSize: 14 }}>
            Деректер жүктелуде...
          </p>
          {showRetry && (
            <div className="animate-fade-in" style={{ marginTop: 24 }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                Жүктелу әдеттегіден ұзақ болып жатыр. Интернет байланысын тексеріңіз.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="btn-secondary"
                style={{ fontSize: 13, padding: "8px 16px" }}
              >
                Бетті жаңарту
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="app-layout">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Mobile Top Header */}
      <header className="mobile-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--gradient-1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GraduationCap size={18} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Smart<span className="gradient-text">Teacher</span></span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-primary)",
          }}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShellInner>{children}</AppShellInner>;
}
