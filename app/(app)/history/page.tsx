"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { History, CalendarDays, Clock, BookOpen, ChevronRight, UserCheck, ClipboardCheck } from "lucide-react";
import Link from "next/link";

interface EvalItem {
  id: string;
  created_at: string;
  score: number;
  answers: any;
  evaluator_id: string;
  teacher_id: string;
  evaluatorName: string;
  teacherName: string;
}

function EvalRow({ ev, currentUserId }: { ev: EvalItem; currentUserId: string }) {
  const isTeacher = ev.teacher_id === currentUserId;
  const pct = Math.round((ev.score / 26) * 100);
  const lessonDate = ev.answers?._lesson_date as string | undefined;
  const lessonTime = ev.answers?._lesson_time as string | undefined;
  const lessonNum = ev.answers?._lesson_number;

  const displayName = isTeacher ? ev.evaluatorName : ev.teacherName;

  return (
    <Link
      href={`/history/${ev.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 18px",
        borderRadius: 14,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-accent)";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 20px rgba(79,126,248,0.1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: "var(--accent-glow)",
        border: "1px solid var(--border-accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, fontWeight: 700, color: "var(--accent-light)", flexShrink: 0,
      }}>
        {displayName ? displayName.charAt(0) : "?"}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
          {displayName ?? "—"}
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-muted)", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <CalendarDays size={12} />
            {lessonDate
              ? new Date(lessonDate).toLocaleDateString("kk-KZ", { day: "numeric", month: "short", year: "numeric" })
              : new Date(ev.created_at).toLocaleDateString("kk-KZ", { day: "numeric", month: "short" })}
          </span>
          {lessonTime && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Clock size={12} />{lessonTime}</span>}
          {lessonNum && <span style={{ display: "flex", alignItems: "center", gap: 5 }}><BookOpen size={12} />{String(lessonNum)}-сабақ</span>}
        </div>
      </div>

      {/* Score */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <span className={ev.score >= 20 ? "badge badge-high" : ev.score >= 13 ? "badge badge-mid" : "badge badge-low"}>
          {ev.score}/26
        </span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{pct}%</span>
      </div>

      <ChevronRight size={18} color="var(--text-muted)" />
    </Link>
  );
}

function Section({
  title, icon, color, evals, currentUserId, emptyText
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  evals: EvalItem[];
  currentUserId: string;
  emptyText: string;
}) {
  return (
    <div className="glass-card" style={{ padding: 24 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{title}</h2>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{evals.length} жазба</span>
        </div>
      </div>

      {evals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 13 }}>
          {emptyText}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {evals.map((ev) => (
            <EvalRow key={ev.id} ev={ev} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [evals, setEvals] = useState<EvalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000); // Polling every 10 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch("/api/history");
      if (res.ok) setEvals(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 60, textAlign: "center" }}><span className="spinner" /></div>;
  }

  // Split into two groups based on current user's role in each evaluation
  const iWasTeacher = evals.filter((ev) => ev.teacher_id === user?.id);
  const iWasEvaluator = evals.filter((ev) => ev.evaluator_id === user?.id);
  // Also show evaluations not involving the current user (visible to all)
  const others = evals.filter((ev) => ev.teacher_id !== user?.id && ev.evaluator_id !== user?.id);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "var(--gradient-1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <History size={22} color="white" />
          </div>
          Бағалаулар тарихы
        </h1>
        <p className="page-subtitle">Барлық бағалаулар · {evals.length} жазба</p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Section 1: Others evaluated me (I am the teacher) */}
        <Section
          title="Мені бағалағандар"
          icon={<UserCheck size={18} color="#059669" />}
          color="#059669"
          evals={iWasTeacher}
          currentUserId={user?.id ?? ""}
          emptyText="Сізді бағалаған жазбалар жоқ"
        />

        {/* Section 2: I evaluated others (I am the evaluator) */}
        <Section
          title="Мен бағалағандар"
          icon={<ClipboardCheck size={18} color="#4f7ef8" />}
          color="#4f7ef8"
          evals={iWasEvaluator}
          currentUserId={user?.id ?? ""}
          emptyText="Сіз бағалаған жазбалар жоқ"
        />

        {/* Section 3: Other evaluations (not involving current user) — visible to all */}
        {others.length > 0 && (
          <Section
            title="Басқа бағалаулар"
            icon={<History size={18} color="#8b5cf6" />}
            color="#8b5cf6"
            evals={others}
            currentUserId={user?.id ?? ""}
            emptyText=""
          />
        )}
      </div>
    </div>
  );
}
