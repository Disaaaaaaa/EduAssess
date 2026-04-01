"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { GraduationCap, Mail, Lock, User, Building2 } from "lucide-react";
import Link from "next/link";

const ROLES = ["teacher", "evaluator", "admin"] as const;

export default function RegisterPage() {
  const t = useTranslations("auth");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "teacher" as typeof ROLES[number],
    schoolName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name, role: form.role, school_name: form.schoolName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div className="glass-card animate-fade-in" style={{ padding: 40, maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Электронды поштаңызды тексеріңіз</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
            <strong>{form.email}</strong> поштасына растау сілтемесі жіберілді. Сілтемені басып, аккаунтыңызды растаңыз.
          </p>
          <Link href="/auth/login" className="btn-primary" style={{ marginTop: 24, display: "inline-flex", justifyContent: "center" }}>
            Кіру бетіне оралу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at top right, rgba(139,92,246,0.07) 0%, transparent 60%), #f5f6fa",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }} className="animate-fade-in">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 56, height: 56, borderRadius: 16,
              background: "var(--gradient-1)", display: "flex",
              alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}
          >
            <GraduationCap size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Smart<span className="gradient-text">Teacher</span>
          </h1>
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>{t("register")}</h2>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "var(--danger)", fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="label">{t("name")}</label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="text" className="input-field" placeholder="Аты-жөніңіз" value={form.name}
                  onChange={(e) => update("name", e.target.value)} required style={{ paddingLeft: 40 }} />
              </div>
            </div>

            <div>
              <label className="label">{t("email")}</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="email" className="input-field" placeholder="email@mektep.kz" value={form.email}
                  onChange={(e) => update("email", e.target.value)} required style={{ paddingLeft: 40 }} />
              </div>
            </div>

            <div>
              <label className="label">{t("password")}</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="password" className="input-field" placeholder="Кем дегенде 8 таңба" value={form.password}
                  onChange={(e) => update("password", e.target.value)} required minLength={8} style={{ paddingLeft: 40 }} />
              </div>
            </div>

            <div>
              <label className="label">{t("role")}</label>
              <div style={{ display: "flex", gap: 8 }}>
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => update("role", role)}
                    style={{
                      flex: 1, padding: "10px 6px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                      border: form.role === role ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: form.role === role ? "var(--accent-glow)" : "transparent",
                      color: form.role === role ? "var(--accent-light)" : "var(--text-secondary)",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {t(`roles.${role}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">{t("schoolName")}</label>
              <div style={{ position: "relative" }}>
                <Building2 size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="text" className="input-field" placeholder="Мектептің атауы" value={form.schoolName}
                  onChange={(e) => update("schoolName", e.target.value)} style={{ paddingLeft: 40 }} />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
              {loading ? <span className="spinner" /> : null}
              {loading ? "..." : t("register")}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--text-secondary)" }}>
            {t("haveAccount")}{" "}
            <Link href="/auth/login" style={{ color: "var(--accent-light)", fontWeight: 600, textDecoration: "none" }}>
              {t("loginHere")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
