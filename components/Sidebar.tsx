"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "./AuthProvider";
import {
  LayoutDashboard,
  ClipboardCheck,
  History,
  LogOut,
  GraduationCap,
  X
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { href: "/evaluate/teacher", icon: ClipboardCheck, label: t("evaluateTeacher") },
    { href: "/history", icon: History, label: t("history") },
  ];

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      {/* Mobile Close Button */}
      <button 
        className="mobile-close-btn" 
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 16,
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          display: "none" // Managed via CSS
        }}
      >
        <X size={20} />
      </button>
      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--gradient-1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GraduationCap size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              Smart<span className="gradient-text">Teacher</span>
            </div>
          </div>
        </div>
        <div className="divider" />
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${pathname.startsWith(href) ? "active" : ""}`}
            onClick={onClose}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ marginTop: "auto", paddingTop: 16 }}>
        <div className="divider" style={{ marginBottom: 16 }} />
        {user && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {user.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              {user.role} • {user.email}
            </div>
          </div>
        )}
        <button onClick={signOut} className="nav-item" style={{ color: "var(--danger)" }}>
          <LogOut size={18} />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}
