import type { Language } from "./types";

interface EvaluationData {
  type: "teacher" | "student";
  criteria: { label: string; score?: number; answer?: boolean }[];
  totalScore: number;
  maxScore: number;
  language: Language;
}

interface FeedbackResult {
  summary: string;
  strengths: string;
  weaknesses: string;
  suggestions: string;
}

const LANG_NAMES: Record<Language, string> = {
  kz: "Kazakh (Қазақша)",
  ru: "Russian (Русский)",
  en: "English",
};

const PROMPTS: Record<Language, Record<string, string>> = {
  kz: {
    teacher: "Мұғалімнің сабақтағы іс-әрекетін бағалау нәтижелері",
    student: "Оқушының жобалық-зерттеушілік дағдыларын бағалау нәтижелері",
    summaryKey: "Қысқаша қорытынды",
    strengthsKey: "Күшті жақтары",
    weaknessesKey: "Жақсартуды қажет ететін тұстар",
    suggestionsKey: "Ұсыныстар",
  },
  ru: {
    teacher: "Результаты оценки деятельности учителя",
    student: "Результаты оценки проектно-исследовательских навыков учащегося",
    summaryKey: "Краткое резюме",
    strengthsKey: "Сильные стороны",
    weaknessesKey: "Стороны, требующие улучшения",
    suggestionsKey: "Рекомендации",
  },
  en: {
    teacher: "Teacher instructional activity evaluation results",
    student: "Student project-based research skills evaluation results",
    summaryKey: "Summary",
    strengthsKey: "Strengths",
    weaknessesKey: "Areas for improvement",
    suggestionsKey: "Suggestions",
  },
};

export async function generateFeedback(data: EvaluationData): Promise<FeedbackResult> {
  const lang = data.language;
  const p = PROMPTS[lang];
  const langName = LANG_NAMES[lang];

  const criteriaText = data.criteria
    .map((c, i) => {
      if (c.answer !== undefined) {
        return `${i + 1}. ${c.label}: ${c.answer ? "✅ Иә/Да/Yes" : "❌ Жоқ/Нет/No"}`;
      } else if (c.score !== undefined) {
        return `${i + 1}. ${c.label}: ${c.score}/3`;
      }
      return `${i + 1}. ${c.label}`;
    })
    .join("\n");

  const systemPrompt = `You are an educational assessment expert. Provide feedback in ${langName} ONLY. 
Respond strictly in this JSON format:
{
  "summary": "2-3 sentence overall summary",
  "strengths": "bullet points of strengths",
  "weaknesses": "bullet points of areas needing improvement",
  "suggestions": "concrete actionable recommendations"
}`;

  const userPrompt = `${p[data.type]}
  
Score: ${data.totalScore}/${data.maxScore}

Criteria results:
${criteriaText}

Provide professional feedback in ${langName}.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const json = await response.json();
  const content = json.choices[0]?.message?.content;
  const parsed = JSON.parse(content);

  return {
    summary: parsed.summary || "",
    strengths: parsed.strengths || "",
    weaknesses: parsed.weaknesses || "",
    suggestions: parsed.suggestions || "",
  };
}
