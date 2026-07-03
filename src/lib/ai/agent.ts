// =============================================================================
// AI Agent — Core Orchestrator
//
// Runs the unified analysis prompt and returns structured results.
// Also handles cover letter generation on demand.
//
// Key responsibilities:
// 1. Run Prompt A (analysis) → parse JSON → validate with Zod → save llm_log
// 2. Run Prompt B (cover letter) → return markdown text
// 3. Safe fallback if JSON parsing fails (never crash the ingest pipeline)
// =============================================================================

import { z } from "zod";
import type { AIProviderAdapter } from "./providers";
import type { AIAnalysisResult, Profile, Vacancy } from "@/types";
import { buildAnalysisPrompt } from "./prompts/analysis";
import { buildCoverLetterPrompt } from "./prompts/cover-letter";

// ---------------------------------------------------------------------------
// Zod schema for AI analysis response validation
// ---------------------------------------------------------------------------

const ScoreBreakdownSchema = z.object({
  skills: z.number().min(0).max(40),
  tech: z.number().min(0).max(25),
  experience: z.number().min(0).max(20),
  salary: z.number().min(0).max(10),
  format: z.number().min(0).max(5),
});

const AIAnalysisSchema = z.object({
  summary: z.string().min(1),
  required_skills: z.array(z.string()).default([]),
  nice_to_have: z.array(z.string()).default([]),
  tech_stack: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  score: z.number().int().min(0).max(100),
  score_breakdown: ScoreBreakdownSchema,
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  missing_skills: z.array(z.string()).default([]),
  salary_fit: z.boolean().default(false),
  recommendation: z.enum(["apply", "maybe", "skip"]),
  interview_topics: z.array(z.string()).default([]),
});

// ---------------------------------------------------------------------------
// Safe fallback — used when JSON parse or validation fails
// ---------------------------------------------------------------------------

const FALLBACK_RESULT: AIAnalysisResult = {
  summary: "AI analysis failed — manual review required.",
  required_skills: [],
  nice_to_have: [],
  tech_stack: [],
  score: 0,
  score_breakdown: { skills: 0, tech: 0, experience: 0, salary: 0, format: 0 },
  pros: [],
  cons: [],
  missing_skills: [],
  salary_fit: false,
  recommendation: "maybe",
  interview_topics: [],
};

// ---------------------------------------------------------------------------
// Agent interface
// ---------------------------------------------------------------------------

export interface AnalysisRunResult {
  analysis: AIAnalysisResult;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  success: boolean;
  errorMsg?: string;
}

export interface CoverLetterRunResult {
  coverLetter: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
}

// ---------------------------------------------------------------------------
// Run analysis (Prompt A)
// ---------------------------------------------------------------------------

export async function runAnalysis(
  provider: AIProviderAdapter,
  profile: Profile,
  vacancyText: string,
  customPrompt?: string | null
): Promise<AnalysisRunResult> {
  const start = Date.now();
  const messages = buildAnalysisPrompt(profile, vacancyText, customPrompt);

  try {
    const result = await provider.complete(messages.system, messages.user, {
      jsonMode: true,
      temperature: 0.1,
      maxTokens: 1500,
    });

    const latencyMs = Date.now() - start;

    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      return {
        analysis: FALLBACK_RESULT,
        ...result,
        latencyMs,
        success: false,
        errorMsg: `JSON parse error. Raw: ${result.text.slice(0, 200)}`,
      };
    }

    // Validate with Zod
    const validated = AIAnalysisSchema.safeParse(parsed);
    if (!validated.success) {
      // Attempt partial recovery — use what we can
      console.error("AI response validation failed:", validated.error.message);
      const partial = parsed as Partial<AIAnalysisResult>;
      return {
        analysis: { ...FALLBACK_RESULT, ...partial },
        ...result,
        latencyMs,
        success: false,
        errorMsg: `Zod validation: ${validated.error.message.slice(0, 300)}`,
      };
    }

    return {
      analysis: validated.data as AIAnalysisResult,
      ...result,
      latencyMs,
      success: true,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      analysis: FALLBACK_RESULT,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs,
      success: false,
      errorMsg,
    };
  }
}

// ---------------------------------------------------------------------------
// Run cover letter (Prompt B)
// ---------------------------------------------------------------------------

export async function runCoverLetter(
  provider: AIProviderAdapter,
  profile: Profile,
  vacancy: Pick<Vacancy, "title" | "company" | "requiredSkills" | "aiSummary" | "pros">,
  customPrompt?: string | null
): Promise<CoverLetterRunResult> {
  const start = Date.now();
  const messages = buildCoverLetterPrompt(profile, vacancy, customPrompt);

  const result = await provider.complete(messages.system, messages.user, {
    temperature: 0.7,
    maxTokens: 800,
  });

  return {
    coverLetter: result.text,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    totalTokens: result.totalTokens,
    latencyMs: Date.now() - start,
  };
}
