"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Sparkles, ChevronRight } from "lucide-react";
import FeedbackPanel from "@/components/FeedbackPanel";

interface Student {
  id: string;
  name: string;
  classes: { name: string } | null;
}

interface StudentRow extends Omit<Student, "classes"> {
  classes: { name: string }[] | { name: string } | null;
}

interface CriterionData {
  label: string;
  levels: string[];
}

interface FeedbackData {
  summary: string;
  strengths: string;
  weaknesses: string;
  suggestions: string;
}

const LEVEL_COLORS = { 3: "var(--success)", 2: "var(--warning)", 1: "var(--danger)" };
const LEVEL_BG = { 3: "rgba(34,211,160,0.08)", 2: "rgba(245,158,11,0.08)", 1: "rgba(239,68,68,0.08)" };

export default function StudentEvalPage() {
  const t = useTranslations("studentEval");
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [scores, setScores] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [error, setError] = useState("");

  const criteria = t.raw("criteria") as CriterionData[];
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  useEffect(() => {
    supabase
      .from("students")
      .select("id, name, classes(name)")
      .then(({ data }) =>
        setStudents(
          (data ?? []).map((item: StudentRow) => ({
            ...item,
            classes: Array.isArray(item.classes) ? item.classes[0] ?? null : item.classes,
          }))
        )
      );
  }, []);

  function setScore(i: number, val: number) {
    setScores((prev) => ({ ...prev, [i]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent) { setError("Оқушыны таңдаңыз"); return; }
    if (Object.keys(scores).length < criteria.length) {
      setError("Барлық критерийлерге баға беріңіз");
      return;
    }
    setSubmitting(true);
    setError("");

    const { data: evalData, error: evalErr } = await supabase
      .from("student_evaluations")
      .insert({ teacher_id: user!.id, student_id: selectedStudent, scores, total: totalScore })
      .select()
      .single();

    if (evalErr) { setError(evalErr.message); setSubmitting(false); return; }
    setSubmitted(true);

    setGeneratingFeedback(true);
    try {
      const res = await fetch("/api/feedback/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluationId: evalData.id,
          evalType: "student",
          criteria: criteria.map((c, i) => ({ label: c.label, score: scores[i + 1] })),
          totalScore,
          maxScore: 18,
        }),
      });
      if (res.ok) setFeedback(await res.json());
    } catch {
      // silence
    } finally {
      setGeneratingFeedback(false);
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: 800 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <CheckCircle2 size={28} color="var(--success)" />
          <h1 className="page-title" style={{ marginBottom: 0 }}>{t("success")}</h1>
        </div>
        <p className="page-subtitle">Оқушы профиліне сақталды</p>

        <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>{t("totalScore")}</div>
              <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.03em" }}>
                <span className="gradient-text">{totalScore}</span>
                <span style={{ fontSize: 20, color: "var(--text-muted)", fontWeight: 400 }}> {t("maxScore")}</span>
              </div>
            </div>
            <div>
              <span className={totalScore >= 13 ? "badge badge-high" : totalScore >= 8 ? "badge badge-mid" : "badge badge-low"} style={{ fontSize: 14, padding: "8px 20px" }}>
                {totalScore >= 13 ? "Жоғары" : totalScore >= 8 ? "Орта" : "Төмен"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {criteria.map((c, i) => {
              const score = scores[i + 1];
              const pct = ((score - 1) / 2) * 100;
              const color = LEVEL_COLORS[score as keyof typeof LEVEL_COLORS] || "var(--text-muted)";
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{c.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}/3</span>
                  </div>
                  <div className="progress-bar">
                    <div style={{ height: "100%", borderRadius: 999, background: color, width: `${pct}%`, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {generatingFeedback ? (
          <div className="glass-card" style={{ padding: 28, textAlign: "center" }}>
            <Sparkles size={24} color="var(--accent)" style={{ marginBottom: 12 }} />
            <p style={{ color: "var(--text-secondary)" }}>ЖИ жауабы жасалуда...</p>
            <span className="spinner" style={{ marginTop: 12 }} />
          </div>
        ) : feedback ? (
          <FeedbackPanel feedback={feedback} title={t("aiFeedback")} t={t} />
        ) : null}

        <button onClick={() => { setSubmitted(false); setScores({}); setSelectedStudent(""); setFeedback(null); }} className="btn-secondary" style={{ marginTop: 20 }}>
          ← Жаңа бағалау
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800 }}>
      <h1 className="page-title">{t("title")}</h1>
      <p className="page-subtitle">{t("subtitle")}</p>

      <form onSubmit={handleSubmit}>
        {/* Select Student */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
          <label className="label">{t("selectStudent")}</label>
          <select className="input-field" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} required>
            <option value="">— Оқушыны таңдаңыз —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.classes ? ` — ${s.classes.name}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Criteria Rubric */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
          {criteria.map((criterion, i) => {
            const idx = i + 1;
            return (
              <div key={idx} className="glass-card" style={{ padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: "var(--accent-glow)", border: "1px solid var(--border-accent)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "var(--accent-light)", flexShrink: 0,
                    }}
                  >
                    {idx}
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 600 }}>{criterion.label}</h3>
                  {scores[idx] && (
                    <span
                      className={scores[idx] === 3 ? "badge badge-high" : scores[idx] === 2 ? "badge badge-mid" : "badge badge-low"}
                      style={{ marginLeft: "auto" }}
                    >
                      {t("level")} {scores[idx]}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[3, 2, 1].map((level) => (
                    <div
                      key={level}
                      className={`level-option ${scores[idx] === level ? `selected-${level}` : ""}`}
                      onClick={() => setScore(idx, level)}
                    >
                      <div
                        style={{
                          width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                          border: `2px solid ${LEVEL_COLORS[level as keyof typeof LEVEL_COLORS]}`,
                          background: scores[idx] === level ? LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s",
                        }}
                      >
                        {scores[idx] === level && (
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS], marginBottom: 4 }}>
                          {level} {level === 3 ? "— Жоғары" : level === 2 ? "— Орта" : "— Төмен"}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          {criterion.levels[3 - level]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Score Preview */}
        <div className="glass-card" style={{ padding: 20, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t("totalScore")}</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              <span className="gradient-text">{totalScore}</span>
              <span style={{ color: "var(--text-muted)", fontSize: 16, fontWeight: 400 }}> {t("maxScore")}</span>
            </div>
          </div>
          <div className="progress-bar" style={{ width: 200 }}>
            <div className="progress-fill" style={{ width: `${(totalScore / 18) * 100}%` }} />
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", color: "var(--danger)", fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? <span className="spinner" /> : <ChevronRight size={18} />}
          {submitting ? t("submitting") : t("submit")}
        </button>
      </form>
    </div>
  );
}
