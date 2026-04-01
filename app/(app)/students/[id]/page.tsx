"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

interface Evaluation {
  id: string;
  created_at: string;
  total: number;
  scores: Record<string, number>;
}

interface Student {
  id: string;
  name: string;
  classes: { name: string } | null;
}

interface StudentRow extends Omit<Student, "classes"> {
  classes: { name: string }[] | { name: string } | null;
}

const CRITERIA_SHORT = ["Мақсат", "Ақпарат", "Бірлесу", "Рефлексия", "Бағалау", "Таныстыру"];

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("students").select("id, name, classes(name)").eq("id", id).single(),
      supabase
        .from("student_evaluations")
        .select("id, created_at, total, scores")
        .eq("student_id", id)
        .order("created_at", { ascending: true }),
    ]).then(([s, e]) => {
      setStudent(
        s.data
          ? {
              ...s.data,
              classes: Array.isArray(s.data.classes) ? s.data.classes[0] ?? null : s.data.classes,
            }
          : null
      );
      setEvals(e.data ?? []);
      setLoading(false);
    });
  }, [id]);

  const avgScore =
    evals.length > 0 ? Math.round((evals.reduce((s, e) => s + e.total, 0) / evals.length) * 10) / 10 : 0;

  const radarData = CRITERIA_SHORT.map((name, i) => {
    const avg =
      evals.length > 0
        ? evals.reduce((s, e) => s + (e.scores?.[String(i + 1)] || 0), 0) / evals.length
        : 0;
    return { name, avg: Math.round(avg * 10) / 10 };
  });

  const lineData = evals.map((e) => ({
    date: new Date(e.created_at).toLocaleDateString("kk-KZ", { month: "short", day: "numeric" }),
    score: e.total,
  }));

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
        <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
        Оқушы табылмады
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Link href="/students" className="btn-secondary" style={{ marginBottom: 24, display: "inline-flex" }}>
        <ArrowLeft size={16} />
        Артқа
      </Link>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
        <div
          style={{
            width: 64, height: 64, borderRadius: 18, background: "var(--gradient-1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 800, color: "white",
          }}
        >
          {student.name.charAt(0)}
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>{student.name}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            {student.classes?.name ?? "Сынып белгіленбеген"} · {evals.length} бағалау
          </p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Орташа балл</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>
            <span className="gradient-text">{avgScore}</span>
            <span style={{ color: "var(--text-muted)", fontSize: 16, fontWeight: 400 }}>/18</span>
          </div>
        </div>
      </div>

      {evals.length === 0 ? (
        <div className="glass-card" style={{ padding: 48, textAlign: "center" }}>
          <TrendingUp size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <p style={{ color: "var(--text-secondary)" }}>Бағалау нәтижелері жоқ</p>
          <Link href="/evaluate/student" className="btn-primary" style={{ marginTop: 16, display: "inline-flex" }}>
            Бағалауды бастау
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Progress Over Time */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Баллдың динамикасы</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData}>
                <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 18]} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)" }}
                />
                <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: "var(--accent)", r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Skills Radar */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Дағдылар профилі</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 3]} tick={false} axisLine={false} />
                <Radar name="Дағды" dataKey="avg" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Evaluation History */}
          <div className="glass-card" style={{ padding: 24, gridColumn: "1/-1" }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Бағалау тарихы</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {evals.slice().reverse().map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 16, padding: "14px 16px",
                    background: "var(--bg-secondary)", borderRadius: 10, border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {new Date(ev.created_at).toLocaleDateString("kk-KZ", { year: "numeric", month: "long", day: "numeric" })}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {CRITERIA_SHORT.map((name, i) => {
                      const s = ev.scores?.[String(i + 1)] || 0;
                      return (
                        <div
                          key={i}
                          title={name}
                          style={{
                            width: 28, height: 28, borderRadius: 6,
                            background: s === 3 ? "rgba(34,211,160,0.2)" : s === 2 ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)",
                            border: `1px solid ${s === 3 ? "rgba(34,211,160,0.4)" : s === 2 ? "rgba(245,158,11,0.4)" : "rgba(239,68,68,0.4)"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 700,
                            color: s === 3 ? "var(--success)" : s === 2 ? "var(--warning)" : "var(--danger)",
                          }}
                        >
                          {s}
                        </div>
                      );
                    })}
                  </div>
                  <span className={ev.total >= 13 ? "badge badge-high" : ev.total >= 8 ? "badge badge-mid" : "badge badge-low"}>
                    {ev.total}/18
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
