// =============================================================================
// GET /api/settings  — Get user settings
// PUT /api/settings  — Update settings
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const SettingsUpdateSchema = z.object({
  aiProvider: z.enum(["openai", "gemini", "claude"]).optional(),
  aiModel: z.string().max(50).optional(),
  openaiKey: z.string().max(200).optional().nullable(),
  geminiKey: z.string().max(200).optional().nullable(),
  claudeKey: z.string().max(200).optional().nullable(),
  telegramBotToken: z.string().max(200).optional().nullable(),
  telegramChatId: z.string().max(50).optional().nullable(),
  hhSearchText: z.string().max(200).optional(),
  hhArea: z.string().max(20).optional(),
  hhPerPage: z.number().int().min(5).max(100).optional(),
  notifyMinScore: z.number().int().min(0).max(100).optional(),
  promptAnalysis: z.string().max(5000).optional().nullable(),
  promptCoverLetter: z.string().max(5000).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

  let settings = await prisma.settings.findUnique({ where: { userId: user.id } });

  // Auto-create on first access
  if (!settings) {
    settings = await prisma.settings.create({
      data: { userId: user.id },
    });
  }

  // Mask API keys — never return actual key values, only whether they're set
  const masked = {
    ...settings,
    openaiKey: settings.openaiKey ? "••••••••" : null,
    geminiKey: settings.geminiKey ? "••••••••" : null,
    claudeKey: settings.claudeKey ? "••••••••" : null,
    telegramBotToken: settings.telegramBotToken ? "••••••••" : null,
  };

  return NextResponse.json({ data: masked });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const result = SettingsUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: result.error.message } }, { status: 400 });
  }

  // Filter out undefined (don't overwrite existing keys with undefined)
  const updateData = Object.fromEntries(
    Object.entries(result.data).filter(([, v]) => v !== undefined)
  );

  const settings = await prisma.settings.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...updateData },
    update: updateData,
  });

  // Return masked version
  const masked = {
    ...settings,
    openaiKey: settings.openaiKey ? "••••••••" : null,
    geminiKey: settings.geminiKey ? "••••••••" : null,
    claudeKey: settings.claudeKey ? "••••••••" : null,
    telegramBotToken: settings.telegramBotToken ? "••••••••" : null,
  };

  return NextResponse.json({ data: masked });
}
