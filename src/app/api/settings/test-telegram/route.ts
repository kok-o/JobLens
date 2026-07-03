// =============================================================================
// POST /api/settings/test-telegram
// Tests Telegram connectivity by sending a test message.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { testTelegramConnection } from "@/lib/telegram";

const Schema = z.object({
  telegramBotToken: z.string().min(1),
  telegramChatId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const result = Schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ ok: false, error: "Bot token and chat ID are required" });
  }

  const { ok, error } = await testTelegramConnection({
    botToken: result.data.telegramBotToken,
    chatId: result.data.telegramChatId,
  });

  return NextResponse.json({ ok, error });
}
