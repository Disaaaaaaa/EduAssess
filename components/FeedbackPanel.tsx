"use client";

interface FeedbackData {
  summary: string;
  strengths: string;
  weaknesses: string;
  suggestions: string;
}

interface Props {
  feedback: FeedbackData;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

export default function FeedbackPanel({ feedback, title, t }: Props) {
  const sections = [
    { key: "summary", label: t("summary"), content: feedback.summary, type: "summary" },
    { key: "strengths", label: t("strengths"), content: feedback.strengths, type: "strengths" },
    { key: "weaknesses", label: t("weaknesses"), content: feedback.weaknesses, type: "weaknesses" },
    { key: "suggestions", label: t("suggestions"), content: feedback.suggestions, type: "suggestions" },
  ];

  const ICONS: Record<string, string> = {
    summary: "📋",
    strengths: "✅",
    weaknesses: "⚠️",
    suggestions: "💡",
  };

  return (
    <div
      className="glass-card animate-fade-in"
      style={{ padding: 28 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--accent-glow)",
            border: "1px solid var(--border-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          🤖
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>GPT-4o-mini · AI-жасалған</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {sections.map(({ key, label, content, type }) => (
          <div key={key} className={`feedback-section ${type}`}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{ICONS[type]}</span>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {label}
              </h4>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
              {content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
