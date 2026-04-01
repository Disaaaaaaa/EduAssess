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
} from "lucide-react";

export default function Sidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t("dashboard") },
    { href: "/evaluate/teacher", icon: ClipboardCheck, label: t("evaluateTeacher") },
    { href: "/history", icon: History, label: t("history") },
  ];

  return (
    <aside className="sidebar">
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
              Edu<span className="gradient-text">Assess</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>AI Platform</div>
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
