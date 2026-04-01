import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { evaluator_id, teacher_id, answers, score } = body;

    console.log("=== /api/evaluate POST ===");
    console.log("evaluator_id:", evaluator_id);
    console.log("teacher_id:", teacher_id);
    console.log("score:", score);
    console.log("answers keys:", answers ? Object.keys(answers) : "NULL");

    if (!evaluator_id || !teacher_id || !answers || score === undefined) {
      console.log("REJECTED: Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createServerSupabase();

    const { data, error } = await supabaseAdmin
      .from("teacher_evaluations")
      .insert({
        evaluator_id,
        teacher_id,
        answers,
        score,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error /api/evaluate:", error.message, error.details, error.hint);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("SUCCESS: inserted id =", data.id);
    return NextResponse.json(data);
  } catch (err) {
    console.error("API /evaluate crash:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
