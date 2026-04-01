"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  CalendarDays,
  Clock,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ClipboardCheck,
  UserCheck,
  FileText,
  Lightbulb,
  Plus,
  Minus,
  Save,
  ArrowUpRight,
} from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface CriterionData {
  label: string;
  levels: string[];
}

// ─── ҰСЫНЫСТАР DATA (from ұсыныстар.docx) ───
interface RecommendationSection {
  title: string;
  type: "checklist" | "table-reflection" | "table-assessment" | "advice";
  instruction: string;
  items: string[];
  tableRows?: string[];
  tableColumns?: string[];
  assessmentCriteria?: string[];
}

const RECOMMENDATION_SECTIONS: RecommendationSection[] = [
  {
    title: "Мақсат қою, жоспарлау",
    type: "checklist",
    instruction: "Сұрақтарды ұсыныз",
    items: [
      "Жобаны не үшін әзірлеймін?",
      "Бұл жобадан қандай нәтиже күтемін?",
      "Қандай әдіс-тәсілдер тиімді болмақ?",
      "Қандай ресурстарды қолданамын?",
      "Жобаны қалай іске асырамын?",
      "Жобаны қалай жетілдіруге болады?",
    ],
  },
  {
    title: "Әртүрлі дереккөздерден ақпараттарды табу және талдау",
    type: "checklist",
    instruction: "Сұрақтарды ұсыныз",
    items: [
      "Бұл ақпараттар түсінікті ме?",
      "Ақпараттарды өңдей аласың ба?",
      "Ақпараттардың жоба, өнім жасауда тиімділігі қандай?",
      "Қандай теорияларға сүйендің?",
      "Дереккөздердің қажетті тұсын түртіп алдың ба?",
      "Басқа қандай дереккөздер қажет болмақ?",
    ],
  },
  {
    title: "Ынтымақтаса жұмыс істеп, өнім жасау",
    type: "checklist",
    instruction: "Тапсырманы ұсыныңыз",
    items: [
      "Тақырыпты зертте.",
      "Ақпараттарды анықта, талда.",
      "Өнім түрін белгіле.",
      "Қажетті бұйымдарды жинақта.",
      "Өнім жасаудың ережелерін қарастыр.",
      "Өнімді жаса.",
    ],
  },
  {
    title: "Рефлексиялау",
    type: "table-reflection",
    instruction: "Кестені толтыруды сұраңыз",
    items: [],
    tableRows: [
      "Мәселе",
      "Өзектілігі",
      "Зерттеу сұрағы",
      "Зерттеу әдістері",
      "Жоспар бойынша әрекет",
      "Қорытынды",
    ],
    tableColumns: ["Мен не үйрендім?", "Нені өзгертуім керек?"],
  },
  {
    title: "Бағалау",
    type: "table-assessment",
    instruction: "Кестені толтыруды сұраңыз",
    items: [],
    assessmentCriteria: [
      "Зерттеу сұрағы нақты, өзекті",
      "Дереккөздер әртүрлі, талдау терең, қорытынды дәлелді",
      "Өнім креативті, мазмұны терең, құрылымы логикалық, сапалы жасалған",
      "Ойы анық, жүйелі, сенімді сөйлейді, сұрақтарға толық жауап береді",
      "Мәселені анықтай алады",
      "Дереккөздерді тиімді қолдан алады",
      "Ақпаратты талдау, салыстыру, қорытынды жасайды",
      "Өз жұмысын нақты талдайды, қорытынды жасайды",
      "Жобаны таныстыруда ойды жүйелі жеткізеді",
    ],
    tableColumns: ["Сәйкес", "Сәйкес емес", "Қорытынды"],
  },
  {
    title: "Өнімді таныстыру",
    type: "advice",
    instruction: "Кеңестерді ұсыныңыз",
    items: [
      "Тақырыпты нақты және түсінікті айтылуы керек.",
      "Зерттеу сұрағы көрсетілуі тиіс.",
      "Нәтижелер қысқа әрі нақты берілуі керек.",
      "Өнімнің мақсаты мен идеясы түсіндірілсін.",
      "Қорытынды болуы міндетті.",
      "Анық, түсінікті сөйле.",
      "Академиялық/әдеби тіл қолдан.",
      "Қысқа, нақты сөйлемдерлі қолдан.",
    ],
  },
];

const LESSONS = Array.from({ length: 10 }, (_, i) => i + 1);
const LEVEL_COLORS = { 3: "var(--success)", 2: "var(--warning)", 1: "var(--danger)" };
const TOTAL_STEPS = 5;

export default function TeacherEvalPage() {
  const t = useTranslations("teacherEval");
  const ts = useTranslations("studentEval");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [lessonDate, setLessonDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [lessonTime, setLessonTime] = useState("08:00");
  const [lessonNumber, setLessonNumber] = useState<number | null>(null);

  // Form states
  const [answersA, setAnswersA] = useState<Record<number, boolean>>({});
  const [answersB, setAnswersB] = useState<Record<number, number>>({});
  const [qualitativeStrengths, setQualitativeStrengths] = useState("");
  const [qualitativeImprovement, setQualitativeImprovement] = useState("");

  // Recommendations state
  const [enabledSections, setEnabledSections] = useState<Record<number, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  // table-reflection: { "sectionIdx-rowIdx-colIdx": "text" }
  const [reflectionTable, setReflectionTable] = useState<Record<string, string>>({});
  // table-assessment: { "sectionIdx-rowIdx": "сәйкес" | "сәйкес емес" }
  const [assessmentTable, setAssessmentTable] = useState<Record<string, string>>({});
  // table-assessment overall: { "sectionIdx": "text" }
  const [assessmentOverallConclusions, setAssessmentOverallConclusions] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedEvalId, setSavedEvalId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const criteriaA = t.raw("criteria") as string[];
  const criteriaB = ts.raw("criteria") as CriterionData[];

  const scoreA = Object.values(answersA).filter(Boolean).length;
  const scoreB = Object.values(answersB).reduce((a, b) => a + b, 0);
  const totalScore = scoreA + scoreB;
  const maxScore = 8 + 18;

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/teachers?exclude=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setTeachers(data || []);
      })
      .catch(console.error);
  }, [user]);

  function setAnswerA(i: number, val: boolean) {
    setAnswersA((prev) => ({ ...prev, [i]: val }));
  }

  function setAnswerB(i: number, val: number) {
    setAnswersB((prev) => ({ ...prev, [i]: val }));
  }

  function toggleSection(sIdx: number) {
    setEnabledSections((prev) => ({ ...prev, [sIdx]: !prev[sIdx] }));
  }

  function toggleCheckItem(key: string) {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function nextStep() {
    if (step === 0) {
      if (!selectedTeacher || !lessonNumber) {
        setError("Барлық мәліметтерді толтырыңыз");
        return;
      }
    }
    if (step === 1) {
      if (Object.keys(answersA).length < criteriaA.length) {
        setError("Барлық критерийлерге жауап беріңіз");
        return;
      }
    }
    if (step === 2) {
      if (Object.keys(answersB).length < criteriaB.length) {
        setError("Барлық критерийлерге баға беріңіз");
        return;
      }
    }
    // Step 3 (recommendations) - no validation required, optional
    setError("");
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function prevStep() {
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildRecommendationsData() {
    const sections: any[] = [];
    RECOMMENDATION_SECTIONS.forEach((sec, sIdx) => {
      if (!enabledSections[sIdx]) return;
      const sectionData: any = { title: sec.title, type: sec.type };

      if (sec.type === "checklist" || sec.type === "advice") {
        sectionData.selectedItems = sec.items.filter((_, iIdx) => checkedItems[`${sIdx}-${iIdx}`]);
      } else if (sec.type === "table-reflection") {
        const rows: any[] = [];
        (sec.tableRows ?? []).forEach((rowLabel, rIdx) => {
          const cells: Record<string, string> = {};
          (sec.tableColumns ?? []).forEach((_, cIdx) => {
            cells[sec.tableColumns![cIdx]] = reflectionTable[`${sIdx}-${rIdx}-${cIdx}`] ?? "";
          });
          rows.push({ label: rowLabel, ...cells });
        });
        sectionData.tableData = rows;
      } else if (sec.type === "table-assessment") {
        const rows: any[] = [];
        (sec.assessmentCriteria ?? []).forEach((criteria, rIdx) => {
          rows.push({
            criteria,
            result: assessmentTable[`${sIdx}-${rIdx}`] ?? "",
          });
        });
        sectionData.tableData = rows;
        sectionData.overallConclusion = assessmentOverallConclusions[sIdx] ?? "";
      }
      sections.push(sectionData);
    });
    return sections;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!qualitativeStrengths.trim() || !qualitativeImprovement.trim()) {
      setError(t("qualitativeSubtitle"));
      return;
    }

    setSubmitting(true);
    setError("");

    const answersWithMeta = {
      appendix_a: answersA,
      appendix_b: answersB,
      qualitative_notes: {
        strengths: qualitativeStrengths,
        improvement: qualitativeImprovement,
      },
      recommendations: buildRecommendationsData(),
      _lesson_date: lessonDate,
      _lesson_time: lessonTime,
      _lesson_number: lessonNumber,
    };

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluator_id: user!.id,
          teacher_id: selectedTeacher,
          answers: answersWithMeta,
          score: totalScore,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Қате орын алды");
        setSubmitting(false);
        return;
      }

      setSavedEvalId(result.id);
      setSubmitted(true);
      setSubmitting(false);
    } catch (err) {
      setError("Серверге қосылу мүмкін болмады");
      setSubmitting(false);
    }
  }

  // ─── RESULT VIEW ────────────────────────────────────────────────────
  if (submitted) {
    const teacherName = teachers.find((t) => t.id === selectedTeacher)?.name ?? "—";
    const dateFormatted = new Date(lessonDate).toLocaleDateString("kk-KZ", {
      year: "numeric", month: "long", day: "numeric",
    });

    return (
      <div className="animate-fade-in" style={{ maxWidth: 800 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <CheckCircle2 size={28} color="var(--success)" />
          <h1 className="page-title" style={{ marginBottom: 0 }}>{t("success")}</h1>
        </div>
        <p className="page-subtitle">Бағалау нәтижесі сақталды</p>

        <div className="glass-card" style={{ padding: "16px 24px", marginBottom: 16, display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            { icon: <CalendarDays size={15} />, label: dateFormatted },
            { icon: <Clock size={15} />, label: lessonTime },
            { icon: <BookOpen size={15} />, label: `${lessonNumber}-сабақ` },
            { icon: null, label: `👤 ${teacherName}` },
          ].map(({ icon, label }, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
              {icon && <span style={{ color: "var(--accent)" }}>{icon}</span>}
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>{t("totalScore")}</div>
              <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.03em" }}>
                <span className="gradient-text">{totalScore}</span>
                <span style={{ fontSize: 20, color: "var(--text-muted)", fontWeight: 400 }}> / {maxScore}</span>
              </div>
            </div>
            <div style={{ position: "relative", width: 80, height: 80 }}>
              <svg viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray={`${(totalScore / maxScore) * 100} 100`} strokeLinecap="round" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                {Math.round((totalScore / maxScore) * 100)}%
              </div>
            </div>
          </div>

          <div className="divider" style={{ margin: "20px 0" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>1-бөлім (Бірінші қадам)</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {criteriaA.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, fontSize: 12 }}>
                    {answersA[i + 1] ? <CheckCircle2 size={14} color="var(--success)" /> : <XCircle size={14} color="var(--danger)" />}
                    <span style={{ color: answersA[i+1] ? "var(--text-primary)" : "var(--text-muted)" }}>{c.substring(0, 30)}...</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>2-бөлім (Екінші қадам)</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {criteriaB.map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{c.label}</span>
                    <span style={{ fontWeight: 700, color: LEVEL_COLORS[answersB[i+1] as keyof typeof LEVEL_COLORS] }}>{answersB[i+1]}/3</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: "16px 20px", background: "var(--bg-primary)", borderRadius: 12 }}>
             <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{t("evaluatorNotes")}</h4>
             <div style={{ marginBottom: 12 }}>
               <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>{t("qualitativeStrengths")}:</div>
               <div style={{ fontSize: 14 }}>{qualitativeStrengths}</div>
             </div>
             <div>
               <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>{t("qualitativeImprovement")}:</div>
               <div style={{ fontSize: 14 }}>{qualitativeImprovement}</div>
             </div>
          </div>

          {/* ─── RECOMMENDATIONS SUMMARY ─── */}
          {(() => {
            const enabledKeys = Object.keys(enabledSections).filter(k => enabledSections[Number(k)]);
            if (enabledKeys.length === 0) return null;
            return (
              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>💡 Ұсыныстар</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {enabledKeys.map(k => {
                    const sIdx = Number(k);
                    const sec = RECOMMENDATION_SECTIONS[sIdx];
                    if (!sec) return null;
                    const secColor = ["#059669", "#3b82f6", "#8b5cf6", "#d97706", "#e11d48", "#3b82f6"][sIdx % 6];

                    return (
                      <div key={sIdx} style={{ padding: "14px 16px", background: `${secColor}08`, borderRadius: 12, borderLeft: `3px solid ${secColor}` }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: secColor, marginBottom: 10 }}>{sec.title}</div>

                        {/* Checklist / Advice items */}
                        {(sec.type === "checklist" || sec.type === "advice") && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {sec.items.filter((_, iIdx) => checkedItems[`${sIdx}-${iIdx}`]).map((item, iIdx) => (
                              <div key={iIdx} style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--text-secondary)" }}>
                                <CheckCircle2 size={13} color={secColor} style={{ marginTop: 1, flexShrink: 0 }} />
                                <span>{item}</span>
                              </div>
                            ))}
                            {sec.items.filter((_, iIdx) => checkedItems[`${sIdx}-${iIdx}`]).length === 0 && (
                              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Ешқандай ұсыныс белгіленбеді</div>
                            )}
                          </div>
                        )}

                        {/* Reflection Table */}
                        {sec.type === "table-reflection" && (
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: 8, textAlign: "left", borderBottom: `1px solid ${secColor}20`, fontWeight: 600, color: secColor }}>Нысан</th>
                                  {(sec.tableColumns ?? []).map((col, ci) => (
                                    <th key={ci} style={{ padding: 8, textAlign: "left", borderBottom: `1px solid ${secColor}20`, fontWeight: 600, color: secColor }}>{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(sec.tableRows ?? []).map((row, rIdx) => (
                                  <tr key={rIdx}>
                                    <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", fontWeight: 600, color: "var(--text-primary)" }}>{row}</td>
                                    {(sec.tableColumns ?? []).map((col, cIdx) => (
                                      <td key={cIdx} style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                                        {reflectionTable[`${sIdx}-${rIdx}-${cIdx}`] || "—"}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Assessment Table */}
                        {sec.type === "table-assessment" && (
                          <div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              {(sec.assessmentCriteria ?? []).map((criteria, rIdx) => {
                                const val = assessmentTable[`${sIdx}-${rIdx}`] ?? "";
                                return (
                                  <div key={rIdx} style={{ display: "flex", gap: 8, fontSize: 12, alignItems: "center" }}>
                                    {val === "сәйкес" ? <CheckCircle2 size={13} color="#059669" /> : val === "сәйкес емес" ? <XCircle size={13} color="#e11d48" /> : <div style={{ width: 13, height: 13, borderRadius: "50%", border: "1px solid var(--border)" }} />}
                                    <span style={{ color: "var(--text-secondary)" }}>{criteria}</span>
                                  </div>
                                );
                              })}
                            </div>
                            {assessmentOverallConclusions[sIdx] && (
                              <div style={{ marginTop: 10, padding: "10px 12px", background: `${secColor}10`, borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }}>
                                <strong style={{ color: secColor }}>Ортақ қорытынды:</strong> {assessmentOverallConclusions[sIdx]}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            onClick={() => {
              if (savedEvalId) {
                router.push(`/history/${savedEvalId}`);
              } else {
                router.push("/history");
              }
            }}
            className="btn-primary"
            style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Save size={18} /> Сақтау және қарау
          </button>
          <button
            onClick={() => {
              setSubmitted(false);
              setSavedEvalId(null);
              setAnswersA({}); setAnswersB({});
              setQualitativeStrengths(""); setQualitativeImprovement("");
              setEnabledSections({}); setCheckedItems({});
              setReflectionTable({}); setAssessmentTable({});
              setAssessmentOverallConclusions({});
              setStep(0);
            }}
            className="btn-secondary"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <ArrowUpRight size={18} /> Жаңа бағалау
          </button>
        </div>
      </div>
    );
  }

  // ─── STEPPER LABELS ───
  const stepLabels = [
    { label: "Мәліметтер", icon: <CalendarDays size={14} /> },
    { label: "Бірінші қадам", icon: <ClipboardCheck size={14} /> },
    { label: "Екінші қадам", icon: <UserCheck size={14} /> },
    { label: "Ұсыныстар", icon: <Lightbulb size={14} /> },
    { label: t("qualitativeTitle"), icon: <FileText size={14} /> },
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800 }}>
      <h1 className="page-title">{t("title")}</h1>

      {/* Stepper UI */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 32, overflowX: "auto" }}>
        {stepLabels.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: 30, height: 30, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: step >= i ? "var(--accent)" : "var(--border)",
                color: step >= i ? "white" : "var(--text-muted)",
                fontSize: 12, fontWeight: 700, transition: "all 0.3s", flexShrink: 0,
              }}
            >
              {step > i ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <div style={{ fontSize: 11, fontWeight: step === i ? 700 : 500, color: step === i ? "var(--text-primary)" : "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {s.label}
            </div>
            {i < TOTAL_STEPS - 1 && <div style={{ height: 2, flex: 1, background: step > i ? "var(--accent)" : "var(--border)", margin: "0 4px", minWidth: 8 }} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* STEP 0: DETAILS */}
        {step === 0 && (
          <div className="animate-slide-up">
            <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Сабақ туралы мәлімет</h2>

              <div style={{ marginBottom: 20 }}>
                <label className="label">{t("selectTeacher")}</label>
                <select className="input-field" value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} required>
                  <option value="">— {t("selectTeacher")} —</option>
                  {teachers.map((tc) => (
                    <option key={tc.id} value={tc.id}>{tc.name} ({tc.email})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                <div>
                  <label className="label">Күні</label>
                  <input type="date" className="input-field" value={lessonDate} onChange={(e) => setLessonDate(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Уақыты</label>
                  <input type="time" className="input-field" value={lessonTime} onChange={(e) => setLessonTime(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="label">Сабақ нөмірі</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(60px, 1fr))", gap: 8 }}>
                  {LESSONS.map((n) => (
                    <button key={n} type="button" onClick={() => setLessonNumber(n)} className={`num-btn ${lessonNumber === n ? "active" : ""}`}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
            {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(220,38,38,0.05)", borderRadius: 8 }}>{error}</div>}
            <button type="button" onClick={nextStep} className="btn-primary" style={{ width: "100%" }}>
              <span>{tc("next")}</span>
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 1: APPENDIX A */}
        {step === 1 && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>1-бөлім. Мұғалімнің іс-әрекеті</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Бірінші қадамның бағалау критерийлері</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {criteriaA.map((criterion, i) => {
                const idx = i + 1;
                return (
                  <div key={idx} className="glass-card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div className="idx-box">{idx}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ marginBottom: 14, fontSize: 14, lineHeight: 1.6 }}>{criterion}</p>
                        <div className="yn-group">
                          <button type="button" className={`yn-btn yes ${answersA[idx] === true ? "selected" : ""}`} onClick={() => setAnswerA(idx, true)}>✓ {t("yes")}</button>
                          <button type="button" className={`yn-btn no ${answersA[idx] === false ? "selected" : ""}`} onClick={() => setAnswerA(idx, false)}>✗ {t("no")}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(220,38,38,0.05)", borderRadius: 8 }}>{error}</div>}
            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={prevStep} className="btn-secondary" style={{ flex: 1 }}><ChevronLeft size={18} /><span>{tc("back")}</span></button>
              <button type="button" onClick={nextStep} className="btn-primary" style={{ flex: 2 }}><span>{tc("next")}</span><ChevronRight size={18} /></button>
            </div>
          </div>
        )}

        {/* STEP 2: APPENDIX B */}
        {step === 2 && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>2-бөлім. Оқушылардың дағдылары</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>Екінші қадам бойынша білім алушылардың дағдыларын бағалау</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              {criteriaB.map((criterion, i) => {
                const idx = i + 1;
                return (
                  <div key={idx} className="glass-card" style={{ padding: 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                      <div className="idx-box">{idx}</div>
                      <h3 style={{ fontSize: 14, fontWeight: 700 }}>{criterion.label}</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[3, 2, 1].map((level) => (
                        <div key={level} className={`level-option ${answersB[idx] === level ? `selected-${level}` : ""}`} onClick={() => setAnswerB(idx, level)}>
                          <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${LEVEL_COLORS[level as keyof typeof LEVEL_COLORS]}`, background: answersB[idx] === level ? LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {answersB[idx] === level && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] }}>{level} балл</div>
                            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{criterion.levels[3 - level]}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(220,38,38,0.05)", borderRadius: 8 }}>{error}</div>}
            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={prevStep} className="btn-secondary" style={{ flex: 1 }}><ChevronLeft size={18} /><span>{tc("back")}</span></button>
              <button type="button" onClick={nextStep} className="btn-primary" style={{ flex: 2 }}><span>{tc("next")}</span><ChevronRight size={18} /></button>
            </div>
          </div>
        )}

        {/* STEP 3: RECOMMENDATIONS (ҰСЫНЫСТАР) */}
        {step === 3 && (
          <div className="animate-slide-up">
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <Lightbulb size={22} color="var(--accent)" />
                Ұсыныстар
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                Бөлімдерді таңдап, оқушыға берілетін сұрақтар мен кеңестерді белгілеңіз. Кесте бөлімдерін толтырыңыз.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              {RECOMMENDATION_SECTIONS.map((sec, sIdx) => {
                const isEnabled = !!enabledSections[sIdx];
                const sectionColors = ["#059669", "#3b82f6", "#8b5cf6", "#d97706", "#e11d48", "#0891b2"];
                const secColor = sectionColors[sIdx % sectionColors.length];

                return (
                  <div key={sIdx} className="glass-card" style={{
                    padding: 0,
                    overflow: "hidden",
                    border: isEnabled ? `1px solid ${secColor}40` : "1px solid var(--border)",
                    transition: "all 0.2s",
                  }}>
                    {/* Section Toggle Header */}
                    <button
                      type="button"
                      onClick={() => toggleSection(sIdx)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "18px 22px",
                        background: isEnabled ? `${secColor}08` : "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: isEnabled ? `${secColor}18` : "var(--bg-secondary)",
                        border: `1.5px solid ${isEnabled ? secColor : "var(--border)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s", flexShrink: 0,
                      }}>
                        {isEnabled
                          ? <Minus size={16} color={secColor} />
                          : <Plus size={16} color="var(--text-muted)" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isEnabled ? "var(--text-primary)" : "var(--text-secondary)" }}>
                          {sIdx + 1}. {sec.title}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                          {sec.instruction}
                        </div>
                      </div>
                      {isEnabled && (
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          padding: "3px 10px", borderRadius: 20,
                          background: `${secColor}15`, color: secColor,
                          border: `1px solid ${secColor}30`,
                        }}>
                          Таңдалды
                        </span>
                      )}
                    </button>

                    {/* Section Content (when enabled) */}
                    {isEnabled && (
                      <div style={{ padding: "0 22px 22px", borderTop: `1px solid ${secColor}15` }}>

                        {/* Checklist type */}
                        {(sec.type === "checklist" || sec.type === "advice") && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                            {sec.items.map((item, iIdx) => {
                              const key = `${sIdx}-${iIdx}`;
                              const isChecked = !!checkedItems[key];
                              return (
                                <label key={iIdx} style={{
                                  display: "flex", alignItems: "center", gap: 12,
                                  padding: "12px 16px", borderRadius: 10,
                                  background: isChecked ? `${secColor}08` : "var(--bg-secondary)",
                                  border: `1px solid ${isChecked ? `${secColor}35` : "var(--border)"}`,
                                  cursor: "pointer", transition: "all 0.15s",
                                }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleCheckItem(key)}
                                    style={{ display: "none" }}
                                  />
                                  <div style={{
                                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                    border: `2px solid ${isChecked ? secColor : "var(--border)"}`,
                                    background: isChecked ? secColor : "transparent",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.15s",
                                  }}>
                                    {isChecked && <CheckCircle2 size={14} color="white" />}
                                  </div>
                                  <span style={{ fontSize: 13, lineHeight: 1.6, color: isChecked ? "var(--text-primary)" : "var(--text-secondary)" }}>
                                    {iIdx + 1}. {item}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* Reflection table */}
                        {sec.type === "table-reflection" && (
                          <div style={{ marginTop: 16, overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: "10px 14px", textAlign: "left", background: `${secColor}10`, borderBottom: `2px solid ${secColor}30`, fontWeight: 700, fontSize: 12, color: secColor, borderRadius: "8px 0 0 0" }}>
                                    Зерттеу нысаны
                                  </th>
                                  {(sec.tableColumns ?? []).map((col, cIdx) => (
                                    <th key={cIdx} style={{ padding: "10px 14px", textAlign: "left", background: `${secColor}10`, borderBottom: `2px solid ${secColor}30`, fontWeight: 700, fontSize: 12, color: secColor }}>
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(sec.tableRows ?? []).map((row, rIdx) => (
                                  <tr key={rIdx}>
                                    <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                                      {row}
                                    </td>
                                    {(sec.tableColumns ?? []).map((_, cIdx) => (
                                      <td key={cIdx} style={{ padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>
                                        <input
                                          type="text"
                                          placeholder="Жазыңыз..."
                                          value={reflectionTable[`${sIdx}-${rIdx}-${cIdx}`] ?? ""}
                                          onChange={(e) => setReflectionTable((prev) => ({ ...prev, [`${sIdx}-${rIdx}-${cIdx}`]: e.target.value }))}
                                          style={{
                                            width: "100%", padding: "8px 12px", borderRadius: 8,
                                            border: "1px solid var(--border)", background: "var(--bg-primary)",
                                            fontSize: 13, color: "var(--text-primary)",
                                            outline: "none",
                                          }}
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Assessment table */}
                        {sec.type === "table-assessment" && (
                          <div style={{ marginTop: 16, overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: "10px 14px", textAlign: "left", background: `${secColor}10`, borderBottom: `2px solid ${secColor}30`, fontWeight: 700, fontSize: 12, color: secColor }}>
                                    Критерийлер
                                  </th>
                                  <th style={{ padding: "10px 14px", textAlign: "center", background: `${secColor}10`, borderBottom: `2px solid ${secColor}30`, fontWeight: 700, fontSize: 12, color: "#059669", width: 90 }}>
                                    Сәйкес
                                  </th>
                                  <th style={{ padding: "10px 14px", textAlign: "center", background: `${secColor}10`, borderBottom: `2px solid ${secColor}30`, fontWeight: 700, fontSize: 12, color: "#e11d48", width: 110 }}>
                                    Сәйкес емес
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {(sec.assessmentCriteria ?? []).map((criteria, rIdx) => {
                                  const key = `${sIdx}-${rIdx}`;
                                  const val = assessmentTable[key] ?? "";
                                  return (
                                    <tr key={rIdx}>
                                      <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontSize: 13, lineHeight: 1.5, color: "var(--text-primary)" }}>
                                        {criteria}
                                      </td>
                                      <td style={{ padding: "6px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
                                        <button type="button" onClick={() => setAssessmentTable((prev) => ({ ...prev, [key]: "сәйкес" }))}
                                          style={{
                                            width: 28, height: 28, borderRadius: "50%",
                                            border: `2px solid ${val === "сәйкес" ? "#059669" : "var(--border)"}`,
                                            background: val === "сәйкес" ? "#059669" : "transparent",
                                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                            margin: "0 auto",
                                          }}>
                                          {val === "сәйкес" && <CheckCircle2 size={14} color="white" />}
                                        </button>
                                      </td>
                                      <td style={{ padding: "6px", borderBottom: "1px solid var(--border)", textAlign: "center" }}>
                                        <button type="button" onClick={() => setAssessmentTable((prev) => ({ ...prev, [key]: "сәйкес емес" }))}
                                          style={{
                                            width: 28, height: 28, borderRadius: "50%",
                                            border: `2px solid ${val === "сәйкес емес" ? "#e11d48" : "var(--border)"}`,
                                            background: val === "сәйкес емес" ? "#e11d48" : "transparent",
                                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                            margin: "0 auto",
                                          }}>
                                          {val === "сәйкес емес" && <XCircle size={14} color="white" />}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            <div style={{ marginTop: 16 }}>
                              <label className="label" style={{ fontSize: 13, fontWeight: 700, color: secColor }}>Ортақ қорытынды</label>
                              <textarea
                                placeholder="Осы бөлім бойынша ортақ қорытынды жазыңыз..."
                                value={assessmentOverallConclusions[sIdx] ?? ""}
                                onChange={(e) => setAssessmentOverallConclusions((prev) => ({ ...prev, [sIdx]: e.target.value }))}
                                style={{
                                  width: "100%", minHeight: 80, padding: "12px", borderRadius: 10,
                                  border: "1px solid var(--border)", background: "var(--bg-primary)",
                                  fontSize: 14, color: "var(--text-primary)", outline: "none",
                                  resize: "vertical", marginTop: 6,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={prevStep} className="btn-secondary" style={{ flex: 1 }}><ChevronLeft size={18} /><span>{tc("back")}</span></button>
              <button type="button" onClick={nextStep} className="btn-primary" style={{ flex: 2 }}><span>{tc("next")}</span><ChevronRight size={18} /></button>
            </div>
          </div>
        )}

        {/* STEP 4: QUALITATIVE FEEDBACK */}
        {step === 4 && (
          <div className="animate-slide-up">
            <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t("qualitativeTitle")}</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>{t("qualitativeSubtitle")}</p>

              <div style={{ marginBottom: 20 }}>
                <label className="label">{t("qualitativeStrengths")}</label>
                <textarea
                  className="input-field"
                  style={{ minHeight: 120, resize: "vertical" }}
                  placeholder={t("qualitativeStrengthsPlaceholder")}
                  value={qualitativeStrengths}
                  onChange={(e) => setQualitativeStrengths(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">{t("qualitativeImprovement")}</label>
                <textarea
                  className="input-field"
                  style={{ minHeight: 120, resize: "vertical" }}
                  placeholder={t("qualitativeImprovementPlaceholder")}
                  value={qualitativeImprovement}
                  onChange={(e) => setQualitativeImprovement(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <div style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(220,38,38,0.05)", borderRadius: 8 }}>{error}</div>}

            <div style={{ display: "flex", gap: 12 }}>
              <button type="button" onClick={prevStep} className="btn-secondary" style={{ flex: 1 }}><ChevronLeft size={18} /><span>{tc("back")}</span></button>
              <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 2 }}>
                {submitting ? <span className="spinner" /> : <ArrowRight size={18} />}
                <span>{submitting ? tc("submitting") : tc("submit")}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
