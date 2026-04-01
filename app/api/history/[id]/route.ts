import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const evalId = params.id;

    if (!evalId) {
      return NextResponse.json({ error: "Missing evaluation ID" }, { status: 400 });
    }

    const supabaseAdmin = createServerSupabase();

    // Fetch the evaluation without JOIN
    const { data: evaluation, error: evalError } = await supabaseAdmin
      .from("teacher_evaluations")
      .select("id, created_at, score, answers, evaluator_id, teacher_id")
      .eq("id", evalId)
      .single();

    if (evalError) {
      console.error("Supabase API Error /history/[id]:", evalError.message);
      return NextResponse.json({ error: evalError.message }, { status: 500 });
    }

    // Fetch user names separately
    const userIds = [evaluation.evaluator_id, evaluation.teacher_id].filter(Boolean);
    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, name, email")
      .in("id", userIds);

    const userMap: Record<string, { name: string; email: string }> = {};
    (users ?? []).forEach((u: any) => {
      userMap[u.id] = { name: u.name, email: u.email };
    });

    const response = NextResponse.json({
      ...evaluation,
      evaluatorName: userMap[evaluation.evaluator_id]?.name ?? "—",
      teacherName: userMap[evaluation.teacher_id]?.name ?? "—",
      evaluatorEmail: userMap[evaluation.evaluator_id]?.email ?? "",
      teacherEmail: userMap[evaluation.teacher_id]?.email ?? "",
    });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;

  } catch (err) {
    console.error("API /history/[id] crash:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
