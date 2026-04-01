"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { Users, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  classes: { name: string } | null;
  recentScore?: number;
  evalCount?: number;
}

interface StudentRow extends Omit<Student, "classes" | "recentScore" | "evalCount"> {
  classes: { name: string }[] | { name: string } | null;
}

export default function StudentsPage() {
  const t = useTranslations("common");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    const { data: studentsData } = await supabase
      .from("students")
      .select("id, name, classes(name)");

    if (!studentsData) { setLoading(false); return; }

    // Load eval stats for each student
    const enriched = await Promise.all(
      (studentsData as StudentRow[]).map(async (s) => {
        const { data: evals } = await supabase
          .from("student_evaluations")
          .select("total")
          .eq("student_id", s.id)
          .order("created_at", { ascending: false })
          .limit(10);

        const evalList = evals || [];
        return {
          ...s,
          classes: Array.isArray(s.classes) ? s.classes[0] ?? null : s.classes,
          recentScore: evalList[0]?.total,
          evalCount: evalList.length,
        };
      })
    );

    setStudents(enriched);
    setLoading(false);
  }

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  function getScoreStyle(score?: number) {
    if (score === undefined) return { className: "", label: "—" };
    if (score >= 13) return { className: "badge badge-high", label: `${score}/18` };
    if (score >= 8) return { className: "badge badge-mid", label: `${score}/18` };
    return { className: "badge badge-low", label: `${score}/18` };
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 className="page-title">Оқушылар</h1>
          <p className="page-subtitle">Барлық оқушылардың профиліне шолу</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Users size={18} color="var(--text-muted)" />
          <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {students.length} оқушы
          </span>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          className="input-field"
          placeholder="Оқушының аты бойынша іздеу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 60, textAlign: "center" }}>
          <BookOpen size={40} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            {search ? "Іздеу нәтижесі табылмады" : "Оқушылар тізімі бос"}
          </p>
          {!search && (
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8 }}>
              Supabase-те оқушыларды қосыңыз
            </p>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((student) => {
            const { className, label } = getScoreStyle(student.recentScore);
            return (
              <Link
                key={student.id}
                href={`/students/${student.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="glass-card"
                  style={{
                    padding: 22,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: "var(--gradient-1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "white",
                      flexShrink: 0,
                    }}
                  >
                    {student.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{student.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {student.classes?.name ?? "Сынып белгіленбеген"} ·{" "}
                      <span style={{ color: "var(--text-muted)" }}>
                        {student.evalCount} бағалау
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    {className ? (
                      <span className={className}>{label}</span>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Бағалау жоқ</span>
                    )}
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
