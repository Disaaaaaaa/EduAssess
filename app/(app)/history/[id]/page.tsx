"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Send, CalendarDays, Clock, BookOpen } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const CRITERIA_A = [
  "Оқушыларға өнім үлгілері көрсетіледі.",
  "Ұсынылатын өнім талаптары таныстырылады, талқылаулар жүреді.",
  "Өнім жасау үшін оқушыларды жұмыс дескрипторларын құруға қатыстырады.",
  "Зерттеу өнімін әзірлеу үшін мәтіндерді зерттеу жұмысына араластырады.",
  "Оқыту әдісі аясында өнім жасауда оқушыға қолдау көрсетеді.",
  "Топтардың бірін-бірі бағалауында және оқушылардың өзін-өзі бағалауында жобалық-зерттеушілік дағдыларын бағалауын үйлестіреді.",
  "Оқушылардың зерттеу өнімін талапқа сай жасауы үшін сындарлы кері байланыс береді.",
  "Рефлексия жасау барысында жобалық-зерттеушілік дағдыларын дамытуға байланысты ұсыныс беруге бағыттайды.",
];

const CRITERIA_B = [
  "Мақсат қою, жоспарлау",
  "Әртүрлі дереккөздерден ақпараттарды табу және талдау",
  "Ынтымақтаса жұмыс істеп, өнім жасау",
  "Рефлексиялау",
  "Бағалау",
  "Өнімді таныстыру",
];

const LEVEL_LABELS: Record<number, string> = { 3: "Жоғары (3 балл)", 2: "Орта (2 балл)", 1: "Төмен (1 балл)" };
const LEVEL_COLORS: Record<number, string> = { 3: "#059669", 2: "#d97706", 1: "#e11d48" };

export default function HistoryDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    if (params.id) fetchDetail();
  }, [params.id]);

  async function fetchDetail() {
    try {
      const res = await fetch(`/api/history/${params.id}`);
      if (res.ok) setData(await res.json());
      else setData(null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendEmail() {
    if (!data) return;
    setSendingEmail(true);
    setEmailStatus("idle");
    try {
      const toEmail = data.teacherEmail || data.evaluatorEmail;
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationId: data.id, toEmail, data }),
      });
      setEmailStatus(res.ok ? "success" : "error");
    } catch {
      setEmailStatus("error");
    } finally {
      setSendingEmail(false);
    }
  }

  if (loading) return <div style={{ padding: 80, textAlign: "center" }}><span className="spinner" /></div>;
  if (!data) return <div style={{ padding: 40, textAlign: "center", color: "var(--danger)" }}>Деректер табылмады</div>;

  const answers = data.answers ?? {};
  const appendixA: Record<string, boolean> = answers.appendix_a ?? {};
  const appendixB: Record<string, number> = answers.appendix_b ?? {};
  const qualStrengths: string = answers.qualitative_notes?.strengths ?? "";
  const qualImprovement: string = answers.qualitative_notes?.improvement ?? "";
  const lessonDate: string = answers._lesson_date ?? "";
  const lessonTime: string = answers._lesson_time ?? "";
  const lessonNum: any = answers._lesson_number;

  const scoreA = Object.values(appendixA).filter(Boolean).length;
  const scoreB = Object.values(appendixB).reduce((a, b) => a + b, 0);
  const totalScore = data.score ?? (scoreA + scoreB);
  const maxScore = 26;
  const pct = Math.round((totalScore / maxScore) * 100);

  const scoreColor = totalScore >= 20 ? "#059669" : totalScore >= 13 ? "#d97706" : "#e11d48";
  const scoreBg = totalScore >= 20 ? "rgba(5,150,105,0.08)" : totalScore >= 13 ? "rgba(217,119,6,0.08)" : "rgba(225,29,72,0.08)";

  return (
    <div className="animate-fade-in" style={{ maxWidth: 860, margin: "0 auto", paddingBottom: 80 }}>
      {/* Back */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/history" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", textDecoration: "none", fontSize: 14 }}>
          <ArrowLeft size={16} /> Артқа
        </Link>
      </div>

      {/* ─── HEADER ─── */}
      <div className="glass-card" style={{ padding: 32, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Бағалау есебі</h1>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
              {new Date(data.created_at).toLocaleDateString("kk-KZ", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
              <div><span style={{ color: "var(--text-muted)", marginRight: 8 }}>Бағалаған сарапшы:</span><strong>{data.evaluatorName ?? "—"}</strong></div>
              <div><span style={{ color: "var(--text-muted)", marginRight: 8 }}>Бағаланған мұғалім:</span><strong>{data.teacherName ?? "—"}</strong></div>
              {lessonDate && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-secondary)", fontSize: 13 }}>
                    <CalendarDays size={14} />
                    {new Date(lessonDate).toLocaleDateString("kk-KZ", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  {lessonTime && <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-secondary)", fontSize: 13 }}><Clock size={14} />{lessonTime}</span>}
                  {lessonNum && <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-secondary)", fontSize: 13 }}><BookOpen size={14} />{String(lessonNum)}-сабақ</span>}
                </div>
              )}
            </div>
          </div>

          {/* Score circle */}
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 110, height: 110, borderRadius: "50%", background: scoreBg, border: `3px solid ${scoreColor}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 30, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{totalScore}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>/ {maxScore} балл</div>
            </div>
            <div style={{ marginTop: 8, fontWeight: 700, color: scoreColor, fontSize: 15 }}>{pct}%</div>
          </div>
        </div>
      </div>

      {/* ─── APPENDIX A ─── */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>📋 1-бөлім: Мұғалімнің іс-әрекеті</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Жобалық-зерттеушілік іс-әрекетті ұйымдастыру критерийлері (барлығы 8 балл)</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CRITERIA_A.map((label, idx) => {
            const key = String(idx + 1);
            const val = appendixA[key];
            const isDone = val === true || (val as any) === "true" || (val as any) === 1;
            return (
              <div key={idx} style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "14px 16px", borderRadius: 12,
                background: isDone ? "rgba(5,150,105,0.05)" : "rgba(225,29,72,0.04)",
                border: `1px solid ${isDone ? "rgba(5,150,105,0.15)" : "rgba(225,29,72,0.12)"}`,
              }}>
                <div style={{ marginTop: 2, flexShrink: 0 }}>
                  {isDone ? <CheckCircle2 size={18} color="#059669" /> : <XCircle size={18} color="#e11d48" />}
                </div>
                <div style={{ flex: 1, fontSize: 13, lineHeight: 1.6, color: "var(--text-primary)" }}>
                  <span style={{ fontWeight: 700, color: isDone ? "#059669" : "#e11d48", marginRight: 6 }}>{idx + 1}.</span>
                  {label}
                </div>
                <div style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20, color: isDone ? "#059669" : "#e11d48", background: isDone ? "rgba(5,150,105,0.12)" : "rgba(225,29,72,0.1)" }}>
                  {isDone ? "+1" : "0"}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: 10, border: "1px solid var(--border)" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>1-бөлім нәтижесі</span>
          <span style={{ fontWeight: 800, color: scoreColor }}>{scoreA} / 8</span>
        </div>
      </div>

      {/* ─── APPENDIX B ─── */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>📊 2-бөлім: Оқушылардың дағдылары</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Жобалық-зерттеушілік дағдылар критерийлері (барлығы 18 балл)</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CRITERIA_B.map((label, idx) => {
            const key = String(idx + 1);
            const score = appendixB[key] ?? 0;
            const color = LEVEL_COLORS[score] ?? "var(--text-muted)";
            return (
              <div key={idx} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 18px", borderRadius: 12,
                background: "var(--bg-secondary)", border: "1px solid var(--border)",
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}20`, border: `1px solid ${color}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color }}>{score}</span>
                </div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  <span style={{ color: "var(--text-muted)", fontWeight: 500, marginRight: 4 }}>{idx + 1}.</span>
                  {label}
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color, padding: "2px 10px", borderRadius: 20, background: `${color}15` }}>
                    {LEVEL_LABELS[score] ?? "Бағаланбаған"}
                  </span>
                </div>
                <div style={{ flexShrink: 0, fontSize: 13, fontWeight: 700, color }}>
                  {score}/3
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: 10, border: "1px solid var(--border)" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>2-бөлім нәтижесі</span>
          <span style={{ fontWeight: 800, color: scoreColor }}>{scoreB} / 18</span>
        </div>
      </div>

      {/* ─── TOTAL SCORE BAR ─── */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Жалпы балл</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: scoreColor }}>{totalScore} <span style={{ fontSize: 16, color: "var(--text-muted)", fontWeight: 500 }}>/ {maxScore}</span></div>
        </div>
        <div style={{ flex: 1, margin: "0 20px" }}>
          <div style={{ height: 10, borderRadius: 10, background: "var(--bg-secondary)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})`, borderRadius: 10, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, textAlign: "right" }}>{pct}% орындалды</div>
        </div>
      </div>

      {/* ─── QUALITATIVE NOTES ─── */}
      {(qualStrengths || qualImprovement) && (
        <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>✍️ Сарапшы пікірі</h2>
          {qualStrengths && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#059669", marginBottom: 8 }}>Сабақтың күшті жақтары:</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap", paddingLeft: 14, borderLeft: "3px solid rgba(5,150,105,0.3)" }}>
                {qualStrengths}
              </div>
            </div>
          )}
          {qualImprovement && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#d97706", marginBottom: 8 }}>Жақсартуға ұсыныстар:</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap", paddingLeft: 14, borderLeft: "3px solid rgba(217,119,6,0.3)" }}>
                {qualImprovement}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── RECOMMENDATIONS (ҰСЫНЫСТАР) ─── */}
      {answers.recommendations && answers.recommendations.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, paddingLeft: 8 }}>💡 Ұсыныстар</h2>
          {answers.recommendations.map((sec: any, idx: number) => {
            const secColor = ["#059669", "#3b82f6", "#8b5cf6", "#d97706", "#e11d48"][idx % 5];
            return (
              <div key={idx} className="glass-card" style={{ padding: 28, borderLeft: `4px solid ${secColor}` }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: secColor, marginBottom: 16 }}>{idx + 1}. {sec.title}</h3>
                
                {/* Checklist/Advice style */}
                {(sec.type === "checklist" || sec.type === "advice") && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {sec.selectedItems?.map((item: string, iIdx: number) => (
                      <div key={iIdx} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 14, color: "var(--text-primary)" }}>
                        <div style={{ marginTop: 3 }}><CheckCircle2 size={16} color={secColor} /></div>
                        <div>{item}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reflection Table style */}
                {sec.type === "table-reflection" && (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: 12, textAlign: "left", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>Зерттеу нысаны</th>
                          <th style={{ padding: 12, textAlign: "left", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>Мен не үйрендім?</th>
                          <th style={{ padding: 12, textAlign: "left", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>Нені өзгертуім керек?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sec.tableData?.map((row: any, rIdx: number) => (
                          <tr key={rIdx}>
                            <td style={{ padding: 12, borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{row.label}</td>
                            <td style={{ padding: 12, borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>{row["Мен не үйрендім?"]}</td>
                            <td style={{ padding: 12, borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>{row["Нені өзгертуім керек?"]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Assessment Table style */}
                {sec.type === "table-assessment" && (
                  <div>
                    <div style={{ overflowX: "auto", marginBottom: sec.overallConclusion ? 16 : 0 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr>
                            <th style={{ padding: 12, textAlign: "left", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>Критерийлер</th>
                            <th style={{ padding: 12, textAlign: "center", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", width: 100 }}>Нәтиже</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sec.tableData?.map((row: any, rIdx: number) => (
                            <tr key={rIdx}>
                              <td style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>{row.criteria}</td>
                              <td style={{ padding: 12, borderBottom: "1px solid var(--border)", textAlign: "center" }}>
                                {row.result === "сәйкес" ? <CheckCircle2 size={18} color="#059669" /> : row.result === "сәйкес емес" ? <XCircle size={18} color="#e11d48" /> : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {sec.overallConclusion && (
                      <div style={{ padding: 16, background: `${secColor}08`, borderRadius: 12, border: `1px solid ${secColor}20` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: secColor, textTransform: "uppercase", marginBottom: 6 }}>Ортақ қорытынды:</div>
                        <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{sec.overallConclusion}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}


      {/* ─── EMAIL SEND ─── */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleSendEmail}
          disabled={sendingEmail}
          className="submit-btn"
          style={{ width: "auto", padding: "0 28px", height: 46, display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}
        >
          {sendingEmail ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <Send size={17} />}
          Мұғалімге email жіберу
        </button>
      </div>
      {emailStatus === "success" && (
        <div style={{ marginTop: 16, padding: 16, background: "rgba(5,150,105,0.1)", color: "#10b981", borderRadius: 12, fontSize: 14, textAlign: "center" }}>
          ✅ Есеп мұғалімнің поштасына сәтті жіберілді!
        </div>
      )}
      {emailStatus === "error" && (
        <div style={{ marginTop: 16, padding: 16, background: "rgba(225,29,72,0.08)", color: "#f43f5e", borderRadius: 12, fontSize: 14, textAlign: "center" }}>
          ❌ Қате орын алды. RESEND_API_KEY конфигурацияланды ма?
        </div>
      )}
    </div>
  );
}
