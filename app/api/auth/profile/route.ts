import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const supabaseAdmin = createServerSupabase();
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      // If user profile doesn't exist, we'll return that info so the frontend can create it
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("API /auth/profile crash:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile } = body;

    if (!profile || !profile.id) {
      return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
    }

    const supabaseAdmin = createServerSupabase();
    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert(profile)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("API /auth/profile POST crash:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
