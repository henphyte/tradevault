import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { analyzeTradesWithAI } from "@/lib/groq";
import type { Trade, Profile, AIAnalyzeRequest } from "@/types";

/**
 * POST /api/ai/analyze
 * Body: { prompt: string, profile_id: string }
 *
 * Loads the profile's trade history, builds an analytics context, and sends
 * it to Groq (llama-3.3-70b-versatile) for a coaching response.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await request.json()) as AIAnalyzeRequest;
    const { prompt, profile_id } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt field" }, { status: 400 });
    }
    if (!profile_id || typeof profile_id !== "string") {
      return NextResponse.json({ error: "Missing profile_id field" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profile_id)
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: trades, error: tradesError } = await supabase
      .from("trades")
      .select("*")
      .eq("profile_id", profile_id)
      .order("open_time", { ascending: true });

    if (tradesError) throw tradesError;

    const response = await analyzeTradesWithAI(
      prompt,
      (trades ?? []) as Trade[],
      (profile as Profile).starting_balance
    );

    return NextResponse.json({ response });
  } catch (err) {
    console.error("AI analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
