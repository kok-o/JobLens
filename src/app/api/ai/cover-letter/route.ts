// =============================================================================
// POST /api/ai/cover-letter
//
// On-demand cover letter generation (Prompt B).
// Called when user clicks "Generate Cover Letter" on the vacancy detail page.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createAIProvider } from "@/lib/ai/providers";
import { runCoverLetter } from "@/lib/ai/agent";
import type { Profile, Vacancy } from "@/types";

const RequestSchema = z.object({
  vacancyId: z.string().min(1),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function prismaProfileToProfile(p: any): Profile {
  return {
    id: p.id,
    userId: p.userId,
    name: p.name,
    summary: p.summary,
    skills: p.skills ?? [],
    technologies: p.technologies ?? [],
    experience: Array.isArray(p.experience) ? p.experience : [],
    salaryMin: p.salaryMin,
    salaryMax: p.salaryMax,
    currency: p.currency ?? "KZT",
    workFormats: p.workFormats ?? [],
    languages: p.languages ?? [],
    cities: p.cities ?? [],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const result = RequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: result.error.message } }, { status: 400 });
  }

  const [vacancy, profile, settings] = await Promise.all([
    prisma.vacancy.findFirst({
      where: { id: result.data.vacancyId, userId: user.id },
      select: {
        id: true, title: true, company: true,
        requiredSkills: true, aiSummary: true, pros: true,
      },
    }),
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.settings.findUnique({ where: { userId: user.id } }),
  ]);

  if (!vacancy) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Vacancy not found" } }, { status: 404 });
  if (!profile) return NextResponse.json({ error: { code: "NO_PROFILE", message: "Complete your profile first" } }, { status: 400 });
  if (!settings) return NextResponse.json({ error: { code: "NO_SETTINGS", message: "Configure your AI settings first" } }, { status: 400 });

  const aiProvider = createAIProvider({
    provider: settings.aiProvider as "openai" | "gemini" | "claude",
    model: settings.aiModel,
    openaiKey: settings.openaiKey,
    geminiKey: settings.geminiKey,
    claudeKey: settings.claudeKey,
  });

  const vacancyForPrompt: Pick<Vacancy, "title" | "company" | "requiredSkills" | "aiSummary" | "pros"> = {
    title: vacancy.title,
    company: vacancy.company,
    requiredSkills: vacancy.requiredSkills,
    aiSummary: vacancy.aiSummary,
    pros: vacancy.pros,
  };

  const run = await runCoverLetter(
    aiProvider,
    prismaProfileToProfile(profile),
    vacancyForPrompt,
    settings.promptCoverLetter
  );

  // Save to vacancy record
  await Promise.all([
    prisma.vacancy.update({
      where: { id: vacancy.id },
      data: { coverLetter: run.coverLetter },
    }),
    prisma.llmLog.create({
      data: {
        userId: user.id,
        vacancyId: vacancy.id,
        provider: settings.aiProvider,
        model: settings.aiModel,
        operation: "cover_letter",
        promptTokens: run.promptTokens,
        completionTokens: run.completionTokens,
        totalTokens: run.totalTokens,
        latencyMs: run.latencyMs,
        success: true,
      },
    }),
  ]);

  return NextResponse.json({ data: { coverLetter: run.coverLetter } });
}
