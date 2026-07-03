// =============================================================================
// Prompt B — Cover Letter (On-Demand)
//
// Called only when the user clicks "Generate Cover Letter".
// 90–95% of vacancies will never trigger this, saving token costs.
// Output: markdown-formatted 3-paragraph letter.
// =============================================================================

import type { Profile, Vacancy } from "@/types";

const SYSTEM_PROMPT = `You are a professional resume writer specializing in tech roles.
Write authentic, non-generic cover letters that sound like a real person wrote them.

Requirements:
- Exactly 3 paragraphs separated by blank lines
- Tone: confident, specific, conversational — not corporate
- Avoid these clichéd phrases: "I am excited", "passionate about", "team player", 
  "results-driven", "hard-working", "synergy", "leverage", "cutting-edge"
- Each paragraph must contain at least one specific detail from the job posting or profile
- Output in markdown format
- Maximum 350 words`;

export interface CoverLetterMessages {
  system: string;
  user: string;
}

export function buildCoverLetterPrompt(
  profile: Profile,
  vacancy: Pick<Vacancy, "title" | "company" | "requiredSkills" | "aiSummary" | "pros">,
  customPrompt?: string | null
): CoverLetterMessages {
  const system = customPrompt?.trim() || SYSTEM_PROMPT;

  const matchingSkills = profile.skills.filter((s) =>
    vacancy.requiredSkills.some(
      (req) => req.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(req.toLowerCase())
    )
  );

  const user = `CANDIDATE: ${profile.name ?? "Candidate"}
SUMMARY: ${profile.summary ?? "Experienced professional"}
RELEVANT SKILLS: ${matchingSkills.join(", ") || profile.skills.slice(0, 6).join(", ")}
TECHNOLOGIES: ${profile.technologies.slice(0, 8).join(", ")}

TARGET ROLE: ${vacancy.title} at ${vacancy.company}
KEY REQUIREMENTS: ${vacancy.requiredSkills.slice(0, 8).join(", ")}
AI ANALYSIS SUMMARY: ${vacancy.aiSummary ?? "Strong candidate match"}
${vacancy.pros.length > 0 ? `WHY THEY FIT: ${vacancy.pros.slice(0, 2).join("; ")}` : ""}

Write the cover letter now.`;

  return { system, user };
}
