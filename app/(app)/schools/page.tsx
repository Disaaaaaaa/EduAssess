"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { School, CalendarDays, Clock, BookOpen, ChevronRight, ChevronDown, Search, ClipboardCheck, Award, TrendingUp } from "lucide-react";
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
  schoolId: string;
  schoolName: string;
}

interface SchoolStats {
  schoolId: string;
  schoolName: string;
  evals: EvalItem[];
  avgScore: number;
  evalCount: number;
}

export default function SchoolsPage() {
  const { user } = useAuth();
  const [evals, setEvals] = useState<EvalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSchools, setExpandedSchools] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchHistory();
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

  // Calculate statistics grouped by school
  const schoolGroups: Record<string, SchoolStats> = {};
  evals.forEach((ev) => {
    const sName = ev.schoolName || "Белгісіз мектеп";
    const sId = ev.schoolId || sName;

    if (!schoolGroups[sId]) {
      schoolGroups[sId] = {
        schoolId: sId,
        schoolName: sName,
        evals: [],
        avgScore: 0,
        evalCount: 0,
      };
    }
    schoolGroups[sId].evals.push(ev);
  });

  Object.values(schoolGroups).forEach((sg) => {
    sg.evalCount = sg.evals.length;
    const sum = sg.evals.reduce((acc, ev) => acc + ev.score, 0);
    sg.avgScore = sg.evalCount > 0 ? Math.round((sum / sg.evalCount) * 10) / 10 : 0;
  });

  const schoolList = Object.values(schoolGroups).filter((sg) =>
    sg.schoolName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedSchools((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return <div style={{ padding: 60, textAlign: "center" }}><span className="spinner" /></div>;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "var(--gradient-1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <School size={22} color="white" />
          </div>
          Мектептер бойынша нәтижелер
        </h1>
        <p className="page-subtitle">Платформаға тіркелген мектептердің статистикасы мен бағалаулары</p>
      </div>

      {/* Search and Filters */}
      <div className="glass-card" style={{ padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Мектеп атауы бойынша іздеу..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-primary)",
            fontSize: 14,
            outline: "none",
            flex: 1
          }}
        />
      </div>

      {schoolList.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
          Деректер табылмады
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {schoolList.map((school) => {
            const isExpanded = !!expandedSchools[school.schoolId];
            const pct = Math.round((school.avgScore / 26) * 100);

            return (
              <div key={school.schoolId} className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                {/* Header of school card */}
                <div
                  onClick={() => toggleExpand(school.schoolId)}
                  style={{
                    padding: "24px 28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    background: isExpanded ? "rgba(255,255,255,0.02)" : "transparent",
                    transition: "background 0.2s",
                    flexWrap: "wrap",
                    gap: 16
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 250, flex: 2 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: "rgba(79, 126, 248, 0.1)",
                      border: "1px solid rgba(79, 126, 248, 0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--accent-light)"
                    }}>
                      <School size={20} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{school.schoolName}</h2>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{school.evalCount} бағалау жасалған</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div style={{ display: "flex", gap: 24, alignItems: "center", flex: 1, justifyContent: "flex-end", minWidth: 200 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 2 }}>Орташа балл</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                        <TrendingUp size={14} color="#059669" />
                        {school.avgScore}/26
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 2 }}>Орташа пайыз</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                        <Award size={14} color="#8b5cf6" />
                        {pct}%
                      </div>
                    </div>

                    {isExpanded ? <ChevronDown size={20} color="var(--text-muted)" /> : <ChevronRight size={20} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Collapsible evaluations list */}
                {isExpanded && (
                  <div style={{ padding: "0 28px 24px 28px", borderTop: "1px solid var(--border)", background: "rgba(0,0,0,0.05)" }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, margin: "20px 0 12px 0", color: "var(--text-secondary)" }}>Бағалаулар тізімі:</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {school.evals.map((ev) => {
                        const lessonDate = ev.answers?._lesson_date as string | undefined;
                        const lessonTime = ev.answers?._lesson_time as string | undefined;
                        const lessonNum = ev.answers?._lesson_number;
                        const lessonTitle = ev.answers?._lesson_title;

                        return (
                          <Link
                            key={ev.id}
                            href={`/history/${ev.id}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 16,
                              padding: "14px 18px",
                              borderRadius: 12,
                              background: "var(--bg-secondary)",
                              border: "1px solid var(--border)",
                              textDecoration: "none",
                              color: "inherit",
                              transition: "all 0.15s",
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
                            {/* Avatar */}
                            <div style={{
                              width: 38, height: 38, borderRadius: 10,
                              background: "var(--accent-glow)",
                              border: "1px solid var(--border-accent)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 14, fontWeight: 700, color: "var(--accent-light)", flexShrink: 0,
                            }}>
                              {ev.teacherName.charAt(0)}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                                {ev.teacherName} <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: 12 }}>← {ev.evaluatorName} (сарапшы)</span>
                              </div>
                              {lessonTitle && (
                                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {lessonTitle}
                                </div>
                              )}
                              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <CalendarDays size={11} />
                                  {lessonDate
                                    ? new Date(lessonDate).toLocaleDateString("kk-KZ", { day: "numeric", month: "short", year: "numeric" })
                                    : new Date(ev.created_at).toLocaleDateString("kk-KZ", { day: "numeric", month: "short" })}
                                </span>
                                {lessonTime && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} />{lessonTime}</span>}
                                {lessonNum && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><BookOpen size={11} />{String(lessonNum)}-сабақ</span>}
                              </div>
                            </div>

                            {/* Score */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span className={ev.score >= 20 ? "badge badge-high" : ev.score >= 13 ? "badge badge-mid" : "badge badge-low"}>
                                {ev.score}/26
                              </span>
                              <ChevronRight size={16} color="var(--text-muted)" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
