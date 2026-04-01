import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = createServerSupabase();

    // Step 1: Get all evaluations (no join)
    const { data: rawEvals, error: evalError } = await supabaseAdmin
      .from("teacher_evaluations")
      .select("id, created_at, score, answers, evaluator_id, teacher_id")
      .order("created_at", { ascending: false });

    if (evalError) {
      console.error("Supabase /history eval fetch error:", evalError.message);
      return NextResponse.json({ error: evalError.message }, { status: 500 });
    }

    console.log(`/api/history: fetched ${(rawEvals ?? []).length} evaluations`);

    if (!rawEvals || rawEvals.length === 0) {
      return NextResponse.json([]);
    }

    // Step 2: Get all unique user IDs
    const userIds = new Set<string>();
    rawEvals.forEach((e) => {
      if (e.evaluator_id) userIds.add(e.evaluator_id);
      if (e.teacher_id) userIds.add(e.teacher_id);
    });

    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, name, email")
      .in("id", Array.from(userIds));

    if (usersError) {
      console.error("Supabase /history users fetch error:", usersError.message);
    }

    // Step 3: Create user lookup
    const userMap: Record<string, { name: string; email: string }> = {};
    (users ?? []).forEach((u: any) => {
      userMap[u.id] = { name: u.name, email: u.email };
    });

    // Step 4: Merge
    const evals = rawEvals.map((e) => ({
      ...e,
      evaluatorName: userMap[e.evaluator_id]?.name ?? "—",
      teacherName: userMap[e.teacher_id]?.name ?? "—",
      evaluatorEmail: userMap[e.evaluator_id]?.email ?? "",
      teacherEmail: userMap[e.teacher_id]?.email ?? "",
    }));

    const response = NextResponse.json(evals);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return response;
  } catch (err) {
    console.error("API /history crash:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
