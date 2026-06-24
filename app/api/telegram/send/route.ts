import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";

/**
 * POST /api/telegram/send
 * Body: { text: string }
 *
 * Generic authenticated endpoint for sending an ad-hoc Telegram message,
 * e.g. a manual "test notification" button in Settings.
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
    const { text } = body as { text?: string };

    if (!text || typeof text !== "string") {
      return NextResponse.json({ success: false, error: "Missing text field" }, { status: 400 });
    }

    const result = await sendTelegramMessage(text);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Telegram send error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
