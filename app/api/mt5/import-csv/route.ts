import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { parseMT5CSV } from "@/lib/mt5/csv-parser";
import type { Trade } from "@/types";

/**
 * POST /api/mt5/import-csv
 * Body: { csv: string, profile_id: string }
 *
 * Parses an MT5 History CSV export server-side (useful for large files or
 * programmatic imports) and bulk-inserts new trades, skipping duplicates by
 * ticket number. Requires an authenticated user session.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { csv, profile_id } = body as { csv?: string; profile_id?: string };

    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ success: false, error: "Missing csv field" }, { status: 400 });
    }
    if (!profile_id || typeof profile_id !== "string") {
      return NextResponse.json({ success: false, error: "Missing profile_id field" }, { status: 400 });
    }

    // Confirm the profile belongs to the authenticated user.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", profile_id)
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
    }

    const { data: existingTradesData } = await supabase
      .from("trades")
      .select("ticket")
      .eq("profile_id", profile_id);

    const existingTickets = new Set(
      ((existingTradesData ?? []) as Pick<Trade, "ticket">[])
        .map((t) => t.ticket)
        .filter((t): t is string => Boolean(t))
    );

    const result = parseMT5CSV(csv, profile_id, existingTickets);

    if (result.trades.length === 0) {
      return NextResponse.json({
        success: true,
        newTrades: 0,
        duplicatesSkipped: result.duplicatesSkipped,
        errors: result.errors,
      });
    }

    const rows = result.trades.map((t) => ({ ...t, user_id: user.id }));

    const { data: inserted, error: insertError } = await supabase
      .from("trades")
      .insert(rows)
      .select();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      newTrades: inserted?.length ?? 0,
      duplicatesSkipped: result.duplicatesSkipped,
      errors: result.errors,
    });
  } catch (err) {
    console.error("CSV import error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
