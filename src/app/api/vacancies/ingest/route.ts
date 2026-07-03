// =============================================================================
// POST /api/vacancies/ingest
//
// The main webhook endpoint called by n8n after fetching from HeadHunter.
// Secured with Bearer API key (not user session — this is called by automation).
//
// Flow:
// 1. Validate Bearer key
// 2. Parse + validate request body (Zod)
// 3. Dedup check (sourceId + sourceName uniqueness per user)
// 4. Fetch user settings (AI provider, keys, thresholds)
// 5. Fetch user profile (for AI analysis context)
// 6. Run AI analysis (Prompt A)
// 7. Save vacancy + log LLM call
// 8. Send Telegram notification if score >= threshold
// 9. Return created vacancy
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAIProvider } from "@/lib/ai/providers";
import { runAnalysis } from "@/lib/ai/agent";
import { sendVacancyNotification } from "@/lib/telegram";
import type { Profile } from "@/types";

// ---------------------------------------------------------------------------
// Request body schema
// ---------------------------------------------------------------------------

const IngestBodySchema = z.object({
  // Source identification
  sourceId: z.string().min(1),
  sourceName: z.enum(["headhunter", "remoteok", "rss", "telegram"]),
  url: z.string().url(),
  publishedAt: z.string().datetime({ offset: true }).optional().nullable(),

  // Raw vacancy data
  title: z.string().min(1),
  company: z.string().min(1),
  companyLogo: z.string().url().optional().nullable(),
  descriptionRaw: z.string().optional().nullable(),
  salaryFrom: z.number().int().positive().optional().nullable(),
  salaryTo: z.number().int().positive().optional().nullable(),
  salaryCurrency: z.string().optional().nullable(),
  workFormat: z.enum(["remote", "hybrid", "office"]).optional().nullable(),
  experienceReq: z.string().optional().nullable(),
  city: z.string().optional().nullable(),

  // Target user (set in n8n workflow from settings)
  userId: z.string().min(1),
});

type IngestBody = z.infer<typeof IngestBodySchema>;

// ---------------------------------------------------------------------------
// Helper — build app URL for Telegram link
// ---------------------------------------------------------------------------

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

// ---------------------------------------------------------------------------
// Helper — convert Profile from Prisma to our Profile type
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 1. Authenticate — Bearer key check
  const authHeader = req.headers.get("authorization") ?? "";
  const ingestKey = process.env.INGEST_API_KEY;

  if (!ingestKey) {
    return NextResponse.json(
      { error: { code: "SERVER_CONFIG", message: "INGEST_API_KEY not configured" } },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${ingestKey}`) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or missing API key" } },
      { status: 401 }
    );
  }

  // 2. Parse + validate body
  let body: IngestBody;
  try {
    const raw = await req.json();
    const result = IngestBodySchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: result.error.message } },
        { status: 400 }
      );
    }
    body = result.data;
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } },
      { status: 400 }
    );
  }

  // 3. Dedup check — skip if this sourceId+sourceName was already ingested for this user
  const existing = await prisma.vacancy.findFirst({
    where: {
      userId: body.userId,
      sourceId: body.sourceId,
      sourceName: body.sourceName,
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { data: { id: existing.id, duplicate: true } },
      { status: 200 }
    );
  }

  // 4. Fetch settings + profile (needed for AI analysis)
  const [settings, profile] = await Promise.all([
    prisma.settings.findUnique({ where: { userId: body.userId } }),
    prisma.profile.findUnique({ where: { userId: body.userId } }),
  ]);

  // 5. Run AI analysis if profile exists
  let analysisResult = null;
  let llmLogData = null;

  const vacancyText = [
    `Title: ${body.title}`,
    `Company: ${body.company}`,
    body.workFormat ? `Work format: ${body.workFormat}` : null,
    body.city ? `City: ${body.city}` : null,
    body.experienceReq ? `Experience required: ${body.experienceReq}` : null,
    body.salaryFrom || body.salaryTo
      ? `Salary: ${body.salaryFrom ?? "?"} – ${body.salaryTo ?? "?"} ${body.salaryCurrency ?? ""}`
      : null,
    "",
    body.descriptionRaw ?? "",
  ]
    .filter(Boolean)
    .join("\n");

  if (profile && settings) {
    try {
      const aiProvider = createAIProvider({
        provider: settings.aiProvider as "openai" | "gemini" | "claude",
        model: settings.aiModel,
        openaiKey: settings.openaiKey,
        geminiKey: settings.geminiKey,
        claudeKey: settings.claudeKey,
      });

      const run = await runAnalysis(
        aiProvider,
        prismaProfileToProfile(profile),
        vacancyText,
        settings.promptAnalysis
      );

      analysisResult = run.analysis;
      llmLogData = {
        userId: body.userId,
        provider: settings.aiProvider,
        model: settings.aiModel,
        operation: "analysis",
        promptTokens: run.promptTokens,
        completionTokens: run.completionTokens,
        totalTokens: run.totalTokens,
        latencyMs: run.latencyMs,
        success: run.success,
        errorMsg: run.errorMsg ?? null,
      };
    } catch (err) {
      console.error("AI analysis error:", err);
      // Continue without analysis — vacancy still saved
    }
  }

  // 6. Save vacancy to DB
  const vacancy = await prisma.vacancy.create({
    data: {
      userId: body.userId,
      sourceId: body.sourceId,
      sourceName: body.sourceName,
      url: body.url,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,

      title: body.title,
      company: body.company,
      companyLogo: body.companyLogo ?? null,
      descriptionRaw: body.descriptionRaw ?? null,
      salaryFrom: body.salaryFrom ?? null,
      salaryTo: body.salaryTo ?? null,
      salaryCurrency: body.salaryCurrency ?? null,
      workFormat: body.workFormat ?? null,
      experienceReq: body.experienceReq ?? null,
      city: body.city ?? null,

      // AI extracted
      requiredSkills: analysisResult?.required_skills ?? [],
      niceToHave: analysisResult?.nice_to_have ?? [],
      techStack: analysisResult?.tech_stack ?? [],
      interviewTopics: analysisResult?.interview_topics ?? [],

      // AI analysis
      aiSummary: analysisResult?.summary ?? null,
      matchScore: analysisResult?.score ?? null,
      scoreBreakdown: analysisResult?.score_breakdown ? (analysisResult.score_breakdown as unknown as import("@prisma/client").Prisma.InputJsonValue) : undefined,
      pros: analysisResult?.pros ?? [],
      cons: analysisResult?.cons ?? [],
      missingSkills: analysisResult?.missing_skills ?? [],
      salaryFit: analysisResult?.salary_fit ?? null,
      recommendation: analysisResult?.recommendation ?? null,

      analyzedAt: analysisResult ? new Date() : null,
    },
  });

  // 7. Log LLM call
  if (llmLogData) {
    await prisma.llmLog
      .create({ data: { ...llmLogData, vacancyId: vacancy.id } })
      .catch(console.error); // Non-blocking — don't fail ingest if log fails
  }

  // 8. Send Telegram notification if score >= threshold
  if (
    analysisResult &&
    settings?.telegramBotToken &&
    settings?.telegramChatId &&
    (analysisResult.score ?? 0) >= (settings.notifyMinScore ?? 70)
  ) {
    sendVacancyNotification(
      { botToken: settings.telegramBotToken, chatId: settings.telegramChatId },
      {
        title: body.title,
        company: body.company,
        score: analysisResult.score,
        recommendation: analysisResult.recommendation,
        url: body.url,
        vacancyUrl: `${getAppUrl()}/vacancies/${vacancy.id}`,
        salaryFrom: body.salaryFrom,
        salaryTo: body.salaryTo,
        salaryCurrency: body.salaryCurrency,
        city: body.city,
      }
    ).catch(console.error); // Non-blocking

    // 9. Return created vacancy
  }

  return NextResponse.json({ data: vacancy }, { status: 201 });
}
