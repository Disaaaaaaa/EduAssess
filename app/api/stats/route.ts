import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = createServerSupabase();

    // Step 1: Get all evaluations without JOINs
    const { data: rawEvals, error } = await supabaseAdmin
      .from("teacher_evaluations")
      .select("id, created_at, score, answers, evaluator_id, teacher_id")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Supabase API Error /stats:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const evals = rawEvals ?? [];

    // Step 2: Get user names
    const userIds = new Set<string>();
    evals.forEach((e) => {
      if (e.evaluator_id) userIds.add(e.evaluator_id);
      if (e.teacher_id) userIds.add(e.teacher_id);
    });

    let userMap: Record<string, { name: string }> = {};
    if (userIds.size > 0) {
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("id, name")
        .in("id", Array.from(userIds));

      (users ?? []).forEach((u: any) => {
        userMap[u.id] = { name: u.name };
      });
    }

    // Step 3: Merge
    const mergedEvals = evals.map((e) => ({
      ...e,
      teacherName: userMap[e.teacher_id]?.name ?? "—",
      evaluatorName: userMap[e.evaluator_id]?.name ?? "—",
    }));

    const evalCount = mergedEvals.length;
    const avgScore =
      evalCount > 0
        ? Math.round(
            (mergedEvals.reduce((s: number, e: any) => s + e.score, 0) / evalCount) * 10
          ) / 10
        : 0;

    const response = NextResponse.json({
      evalCount,
      avgScore,
      recentEvals: mergedEvals.slice(0, 6),
    });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  } catch (err) {
    console.error("API /stats crash:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
