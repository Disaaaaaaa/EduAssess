import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const excludeId = searchParams.get("exclude");

    const supabaseAdmin = createServerSupabase();
    let query = supabaseAdmin
      .from("users")
      .select("id, name, email")
      .eq("role", "teacher");

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase API Error /teachers:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("API /teachers crash:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
