"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import {
  ClipboardCheck,
  TrendingUp,
  Award,
  ChevronRight,
  CalendarDays,
  Clock,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

interface TeacherEval {
  id: string;
  created_at: string;
  score: number;
  answers: any;
  teacherName?: string;
  evaluatorName?: string;
}

interface Stats {
  evalCount: number;
  avgScore: number;
  recentEvals: TeacherEval[];
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Polling every 10 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        throw new Error("Failed to fetch stats");
      }
    } catch {
      setStats({
        evalCount: 0,
        avgScore: 0,
        recentEvals: [],
      });
    } finally {
      setLoading(false);
    }
  }

  const pct = stats ? Math.round((stats.avgScore / 26) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">
          {t("welcome")},{" "}
          <strong style={{ color: "var(--accent-light)" }}>{user?.name}</strong>{" "}
          👋
        </p>
      </div>

      {/* Stats cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {[
          {
            icon: ClipboardCheck,
            label: "Барлық бағалаулар",
            value: loading ? "—" : stats?.evalCount,
            color: "#4f7ef8",
          },
          {
            icon: TrendingUp,
            label: "Орташа балл",
            value: loading ? "—" : `${stats?.avgScore}/26`,
            color: "#059669",
          },
          {
            icon: Award,
            label: "Орташа пайыз",
            value: loading ? "—" : `${pct}%`,
            color: "#8b5cf6",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="stat-card">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `${color}18`,
                border: `1px solid ${color}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Icon size={22} color={color} />
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: 4,
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action */}
      <div style={{ marginBottom: 32 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
            Жылдам іс-әрекет
          </h3>
          <Link
            href="/evaluate/teacher"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "20px",
              borderRadius: 14,
              border: "1px solid rgba(79,126,248,0.2)",
              background: "rgba(79,126,248,0.04)",
              textDecoration: "none",
              transition: "all 0.15s",
              maxWidth: 500,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                "rgba(79,126,248,0.4)";
              (e.currentTarget as HTMLAnchorElement).style.background =
                "rgba(79,126,248,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                "rgba(79,126,248,0.2)";
              (e.currentTarget as HTMLAnchorElement).style.background =
                "rgba(79,126,248,0.04)";
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "var(--gradient-1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ClipboardCheck size={22} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                Мұғалімді бағалау
              </div>
              <div
                style={{ fontSize: 13, color: "var(--text-secondary)" }}
              >
                4 қадамды форма · 14 критерий · AI кері байланыс
              </div>
            </div>
            <ChevronRight size={18} color="var(--accent)" />
          </Link>
        </div>
      </div>

      {/* Recent teacher evaluations */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>
            Соңғы бағалаулар
          </h3>
          <Link
            href="/history"
            style={{
              fontSize: 13,
              color: "var(--accent-light)",
              textDecoration: "none",
            }}
          >
            Барлығын қарау →
          </Link>
        </div>

        {loading ? (
          <div
            style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}
          >
            <span className="spinner" />
          </div>
        ) : (stats?.recentEvals.length ?? 0) === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: "var(--text-muted)",
              fontSize: 14,
            }}
          >
            Деректер жоқ. Алдымен мұғалімді бағалаңыз.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stats?.recentEvals.map((ev) => {
              const lessonNum = ev.answers?._lesson_number;
              const lessonDate = ev.answers?._lesson_date as string | undefined;
              const lessonTime = ev.answers?._lesson_time as string | undefined;
              const teacherName = ev.teacherName ?? "—";
              const evaluatorName = ev.evaluatorName ?? "";

              return (
                <Link
                  key={ev.id}
                  href={`/history/${ev.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    borderRadius: 12,
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "all 0.18s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-accent)";
                    (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                      background: "var(--accent-glow)",
                      border: "1px solid var(--border-accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--accent-light)",
                      flexShrink: 0,
                    }}
                  >
                    {teacherName.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>
                      {teacherName}
                    </div>
                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-secondary)", flexWrap: "wrap" }}>
                      {evaluatorName && (
                        <span style={{ color: "var(--text-muted)" }}>↳ {evaluatorName}</span>
                      )}
                      {lessonDate && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <CalendarDays size={11} />
                          {new Date(lessonDate).toLocaleDateString("kk-KZ", { day: "numeric", month: "short" })}
                        </span>
                      )}
                      {lessonTime && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={11} />{lessonTime}
                        </span>
                      )}
                      {lessonNum && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <BookOpen size={11} />{String(lessonNum)}-сабақ
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="progress-bar" style={{ width: 60 }}>
                      <div className="progress-fill" style={{ width: `${(ev.score / 26) * 100}%` }} />
                    </div>
                    <span className={ev.score >= 20 ? "badge badge-high" : ev.score >= 13 ? "badge badge-mid" : "badge badge-low"}>
                      {ev.score}/26
                    </span>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
