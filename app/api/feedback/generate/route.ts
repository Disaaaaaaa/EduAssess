import { NextRequest, NextResponse } from "next/server";
import { generateFeedback } from "@/lib/ai";
import { createServerSupabase } from "@/lib/supabase";
import type { Language } from "@/lib/types";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { evaluationId, evalType, criteria, totalScore, maxScore } = body;

    const cookieStore = await cookies();
    const language = (cookieStore.get("locale")?.value ?? "kz") as Language;

    const feedback = await generateFeedback({
      type: evalType,
      criteria,
      totalScore,
      maxScore,
      language,
    });

    // Save to Supabase using service role
    const supabaseAdmin = createServerSupabase();
    const { data: feedbackRow, error: fbErr } = await supabaseAdmin
      .from("feedback")
      .insert({
        evaluation_id: evaluationId,
        eval_type: evalType,
        ...feedback,
      })
      .select()
      .single();

    if (!fbErr && feedbackRow) {
      // Link feedback to evaluation
      const table = evalType === "teacher" ? "teacher_evaluations" : "student_evaluations";
      await supabaseAdmin
        .from(table)
        .update({ feedback_id: feedbackRow.id })
        .eq("id", evaluationId);
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Feedback generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate feedback" },
      { status: 500 }
    );
  }
}
