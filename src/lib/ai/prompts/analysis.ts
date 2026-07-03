// =============================================================================
// Prompt A — Unified Analysis Prompt
//
// One LLM call extracts structured data + scores + explains the vacancy.
// This saves tokens vs a sequential 3-step chain while still being testable.
//
// Usage: buildAnalysisPrompt(profileJson, vacancyText) → system + user messages
// =============================================================================

import type { Profile } from "@/types";

/** Compact representation of profile for prompt injection */
function profileToPromptText(profile: Profile): string {
  const exp = (profile.experience ?? [])
    .map((e) => `${e.role} at ${e.company} (${e.years}y): ${e.description ?? ""}`)
    .join("\n");

  return `Name: ${profile.name ?? "Candidate"}
Summary: ${profile.summary ?? "Not provided"}
Skills: ${profile.skills.join(", ") || "Not specified"}
Technologies: ${profile.technologies.join(", ") || "Not specified"}
Experience:
${exp || "Not specified"}
Salary expectation: ${profile.salaryMin ?? "?"} – ${profile.salaryMax ?? "?"} ${profile.currency}
Preferred work formats: ${profile.workFormats.join(", ") || "any"}
Languages: ${profile.languages.join(", ") || "Not specified"}
Cities: ${profile.cities.join(", ") || "any"}`.trim();
}

const SYSTEM_PROMPT = `You are a senior career advisor and AI recruitment analyst.
Analyze the job posting against the candidate profile.
Return ONLY a valid JSON object. No markdown. No commentary. No explanation.

Use this exact schema:
{
  "summary": "2-3 sentence plain-text summary of the role and why it fits or doesn't fit",
  "required_skills": ["skill1", "skill2"],
  "nice_to_have": ["skill1", "skill2"],
  "tech_stack": ["Tech1", "Tech2"],
  "responsibilities": ["responsibility1", "responsibility2"],
  "score": 75,
  "score_breakdown": {
    "skills": 28,
    "tech": 20,
    "experience": 15,
    "salary": 8,
    "format": 4
  },
  "pros": ["specific reason 1", "specific reason 2", "specific reason 3"],
  "cons": ["honest risk 1", "honest risk 2", "honest risk 3"],
  "missing_skills": ["Skill listed in vacancy but absent from candidate profile"],
  "salary_fit": true,
  "recommendation": "apply",
  "interview_topics": ["topic1", "topic2", "topic3"]
}

Scoring rubric — TOTAL MUST equal exactly sum of breakdown fields (max 100):
- skills (max 40 pts): % of required skills present in candidate profile
- tech (max 25 pts): tech stack overlap score
- experience (max 20 pts): seniority level alignment
- salary (max 10 pts): does salary range overlap with candidate preferences
- format (max 5 pts): remote/hybrid/office preference match

Rules:
- pros: exactly 3 specific, concrete reasons. No generic phrases like "great opportunity"
- cons: exactly 3 honest risks or gaps, be direct
- missing_skills: ONLY skills explicitly listed in the vacancy but absent from the profile
- recommendation: "apply" if score ≥ 75, "maybe" if 50–74, "skip" if < 50
- score must be an integer 0–100
- All arrays must have at least 1 item (use empty string only as last resort)`;

export interface AnalysisMessages {
  system: string;
  user: string;
}

export function buildAnalysisPrompt(
  profile: Profile,
  vacancyText: string,
  customPrompt?: string | null
): AnalysisMessages {
  const system = customPrompt?.trim() || SYSTEM_PROMPT;
  const user = `CANDIDATE PROFILE:
${profileToPromptText(profile)}

JOB POSTING:
${vacancyText.slice(0, 8000)}`; // Hard cap to avoid token explosion

  return { system, user };
}
