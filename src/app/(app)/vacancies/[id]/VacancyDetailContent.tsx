"use client";

// =============================================================================
// Vacancy Detail — Full Implementation (Phase 3)
// Tabs: Overview | AI Analysis | Cover Letter
// =============================================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Heart, ExternalLink, CheckCircle2, XCircle,
  Sparkles, FileText, MapPin, Briefcase, Clock, BadgeCheck,
  AlertTriangle, Copy, Check, Loader2
} from "lucide-react";
import { useVacancy, useToggleFavorite, useUpdateStatus, useGenerateCoverLetter } from "@/hooks/useQueries";
import { ScoreBadge } from "@/components/vacancy/ScoreBadge";
import { SkillTag } from "@/components/vacancy/SkillTag";
import { LoadingSpinner } from "@/components/shared/Skeletons";
import { formatSalary, workFormatToLabel, timeAgo, scoreToLabel, recommendationToLabel } from "@/lib/utils";
import type { VacancyStatus } from "@/types";

const TABS = [
  { id: "overview", label: "Overview", icon: Briefcase },
  { id: "analysis", label: "AI Analysis", icon: Sparkles },
  { id: "cover-letter", label: "Cover Letter", icon: FileText },
] as const;
type TabId = typeof TABS[number]["id"];

const STATUS_OPTIONS: { value: VacancyStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "viewed", label: "Viewed" },
  { value: "applied", label: "Applied ✓" },
  { value: "rejected", label: "Rejected" },
];

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors hover:bg-[hsl(240_4%_14%)]"
      style={{ borderColor: "hsl(240 5% 18%)", color: "hsl(240 4% 65%)" }}
    >
      {copied ? <Check className="h-3 w-3" style={{ color: "hsl(142 71% 45%)" }} /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function VacancyDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const { data: vacancy, isLoading } = useVacancy(id);
  const toggleFavorite = useToggleFavorite();
  const updateStatus = useUpdateStatus();
  const generateCoverLetter = useGenerateCoverLetter();

  if (isLoading) return <LoadingSpinner size={32} />;
  if (!vacancy) {
    return (
      <div className="p-6 text-center">
        <p style={{ color: "hsl(0 72% 51%)" }}>Vacancy not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm underline" style={{ color: "hsl(263 70% 68%)" }}>
          Go back
        </button>
      </div>
    );
  }

  const recommendation = vacancy.recommendation;
  const recColors = {
    apply: { bg: "hsl(142 71% 45% / 0.1)", text: "hsl(142 71% 55%)", border: "hsl(142 71% 45% / 0.3)" },
    maybe: { bg: "hsl(38 92% 50% / 0.1)", text: "hsl(38 92% 60%)", border: "hsl(38 92% 50% / 0.3)" },
    skip: { bg: "hsl(0 72% 51% / 0.1)", text: "hsl(0 72% 61%)", border: "hsl(0 72% 51% / 0.3)" },
  };
  const recColor = recommendation ? recColors[recommendation] : recColors.maybe;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ─── Header ─── */}
      <div
        className="flex-shrink-0 border-b px-6 py-4"
        style={{ borderColor: "hsl(240 5% 18%)" }}
      >
        <div className="flex items-start gap-4">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="mt-0.5 flex-shrink-0 rounded-md p-1.5 transition-colors hover:bg-[hsl(240_4%_14%)]"
            style={{ color: "hsl(240 4% 38%)" }}
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Score badge */}
          <ScoreBadge score={vacancy.matchScore} size="lg" showLabel />

          {/* Title block */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold leading-tight" style={{ color: "hsl(0 0% 98%)" }}>
              {vacancy.title}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "hsl(240 4% 65%)" }}>
              {vacancy.company}
            </p>
            {recommendation && (
              <span
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: recColor.bg, color: recColor.text, borderColor: recColor.border }}
              >
                {recommendation === "apply" ? <BadgeCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                {recommendationToLabel(recommendation)}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Status dropdown */}
            <select
              value={vacancy.status}
              onChange={(e) => updateStatus.mutate({ id: vacancy.id, status: e.target.value })}
              className="rounded-md border bg-transparent px-2 py-1.5 text-xs outline-none"
              style={{
                borderColor: "hsl(240 5% 18%)",
                color: "hsl(240 4% 65%)",
                backgroundColor: "hsl(240 6% 7%)",
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} style={{ backgroundColor: "hsl(240 6% 7%)" }}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Favorite */}
            <button
              onClick={() => toggleFavorite.mutate({ id: vacancy.id, isFavorite: vacancy.isFavorite })}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors hover:bg-[hsl(240_4%_14%)]"
              style={{
                borderColor: "hsl(240 5% 18%)",
                color: vacancy.isFavorite ? "hsl(0 72% 51%)" : "hsl(240 4% 65%)",
              }}
            >
              <Heart className="h-3.5 w-3.5" fill={vacancy.isFavorite ? "currentColor" : "none"} />
              {vacancy.isFavorite ? "Saved" : "Save"}
            </button>

            {/* External link */}
            <a
              href={vacancy.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors hover:bg-[hsl(240_4%_14%)]"
              style={{ borderColor: "hsl(240 5% 18%)", color: "hsl(240 4% 65%)" }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div
        className="flex-shrink-0 border-b px-6"
        style={{ borderColor: "hsl(240 5% 18%)" }}
      >
        <div className="flex gap-0">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors"
              style={{
                borderBottomColor: activeTab === tabId ? "hsl(263 70% 58%)" : "transparent",
                color: activeTab === tabId ? "hsl(263 70% 68%)" : "hsl(240 4% 38%)",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      <div className="flex-1 p-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6 max-w-3xl animate-fade-in">
            {/* Meta grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Salary", value: formatSalary(vacancy.salaryFrom, vacancy.salaryTo, vacancy.salaryCurrency) },
                { label: "Work Format", value: vacancy.workFormat ? workFormatToLabel(vacancy.workFormat) : "Not specified" },
                { label: "City", value: vacancy.city ?? "Not specified" },
                { label: "Published", value: vacancy.publishedAt ? timeAgo(vacancy.publishedAt) : "Unknown" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border p-3" style={{ backgroundColor: "hsl(240 6% 7%)", borderColor: "hsl(240 5% 18%)" }}>
                  <p className="text-xs font-medium" style={{ color: "hsl(240 4% 38%)" }}>{label}</p>
                  <p className="mt-1 text-sm font-medium" style={{ color: "hsl(0 0% 98%)" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Tech stack */}
            {vacancy.techStack.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: "hsl(0 0% 98%)" }}>Tech Stack</h3>
                <div className="flex flex-wrap gap-1.5">
                  {vacancy.techStack.map((t) => <SkillTag key={t} label={t} variant="tech" />)}
                </div>
              </div>
            )}

            {/* Required skills */}
            {vacancy.requiredSkills.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: "hsl(0 0% 98%)" }}>Required Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {vacancy.requiredSkills.map((s) => <SkillTag key={s} label={s} variant="required" />)}
                </div>
              </div>
            )}

            {/* Nice to have */}
            {vacancy.niceToHave.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: "hsl(0 0% 98%)" }}>Nice to Have</h3>
                <div className="flex flex-wrap gap-1.5">
                  {vacancy.niceToHave.map((s) => <SkillTag key={s} label={s} variant="nice" />)}
                </div>
              </div>
            )}

            {/* Description */}
            {vacancy.descriptionRaw && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: "hsl(0 0% 98%)" }}>Job Description</h3>
                <div
                  className="rounded-lg border p-4 text-sm whitespace-pre-wrap leading-relaxed"
                  style={{
                    backgroundColor: "hsl(240 6% 7%)",
                    borderColor: "hsl(240 5% 18%)",
                    color: "hsl(240 4% 65%)",
                    maxHeight: "400px",
                    overflowY: "auto",
                  }}
                >
                  {vacancy.descriptionRaw}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI ANALYSIS TAB */}
        {activeTab === "analysis" && (
          <div className="space-y-6 max-w-3xl animate-fade-in">
            {!vacancy.aiSummary ? (
              <div className="rounded-lg border p-6 text-center" style={{ backgroundColor: "hsl(240 6% 7%)", borderColor: "hsl(240 5% 18%)" }}>
                <Sparkles className="h-6 w-6 mx-auto mb-2" style={{ color: "hsl(240 4% 38%)" }} />
                <p className="text-sm" style={{ color: "hsl(240 4% 38%)" }}>AI analysis not yet available for this vacancy.</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="rounded-lg border p-4" style={{ backgroundColor: "hsl(240 6% 7%)", borderColor: "hsl(240 5% 18%)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4" style={{ color: "hsl(263 70% 68%)" }} />
                    <h3 className="text-sm font-semibold" style={{ color: "hsl(0 0% 98%)" }}>AI Summary</h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "hsl(240 4% 65%)" }}>{vacancy.aiSummary}</p>
                </div>

                {/* Score breakdown */}
                {vacancy.scoreBreakdown && (
                  <div className="rounded-lg border p-4" style={{ backgroundColor: "hsl(240 6% 7%)", borderColor: "hsl(240 5% 18%)" }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: "hsl(0 0% 98%)" }}>Score Breakdown</h3>
                    <div className="space-y-2">
                      {[
                        { key: "skills", label: "Skills Match", max: 40 },
                        { key: "tech", label: "Tech Overlap", max: 25 },
                        { key: "experience", label: "Experience Level", max: 20 },
                        { key: "salary", label: "Salary Fit", max: 10 },
                        { key: "format", label: "Work Format", max: 5 },
                      ].map(({ key, label, max }) => {
                        const val = (vacancy.scoreBreakdown as unknown as Record<string, number>)?.[key] ?? 0;
                        const pct = (val / max) * 100;
                        const color = pct >= 75 ? "hsl(142 71% 45%)" : pct >= 50 ? "hsl(38 92% 50%)" : "hsl(0 72% 51%)";
                        return (
                          <div key={key}>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs" style={{ color: "hsl(240 4% 65%)" }}>{label}</span>
                              <span className="text-xs font-medium" style={{ color }}>{val}/{max}</span>
                            </div>
                            <div className="h-1.5 rounded-full" style={{ backgroundColor: "hsl(240 5% 18%)" }}>
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, backgroundColor: color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pros/Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Pros */}
                  <div className="rounded-lg border p-4" style={{ backgroundColor: "hsl(240 6% 7%)", borderColor: "hsl(142 71% 45% / 0.2)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(142 71% 45%)" }} />
                      <h3 className="text-sm font-semibold" style={{ color: "hsl(142 71% 55%)" }}>Strengths</h3>
                    </div>
                    <ul className="space-y-2">
                      {vacancy.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "hsl(240 4% 65%)" }}>
                          <span className="mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "hsl(142 71% 45%)" }} />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div className="rounded-lg border p-4" style={{ backgroundColor: "hsl(240 6% 7%)", borderColor: "hsl(0 72% 51% / 0.2)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <XCircle className="h-4 w-4" style={{ color: "hsl(0 72% 51%)" }} />
                      <h3 className="text-sm font-semibold" style={{ color: "hsl(0 72% 61%)" }}>Risks</h3>
                    </div>
                    <ul className="space-y-2">
                      {vacancy.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "hsl(240 4% 65%)" }}>
                          <span className="mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "hsl(0 72% 51%)" }} />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Missing skills */}
                {vacancy.missingSkills.length > 0 && (
                  <div className="rounded-lg border p-4" style={{ backgroundColor: "hsl(240 6% 7%)", borderColor: "hsl(240 5% 18%)" }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: "hsl(0 0% 98%)" }}>Missing Skills</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {vacancy.missingSkills.map((s) => <SkillTag key={s} label={s} variant="missing" />)}
                    </div>
                    <p className="mt-2 text-xs" style={{ color: "hsl(240 4% 38%)" }}>
                      These skills appear in the job posting but not in your profile.
                    </p>
                  </div>
                )}

                {/* Interview topics */}
                {vacancy.interviewTopics.length > 0 && (
                  <div className="rounded-lg border p-4" style={{ backgroundColor: "hsl(240 6% 7%)", borderColor: "hsl(240 5% 18%)" }}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: "hsl(0 0% 98%)" }}>Likely Interview Topics</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {vacancy.interviewTopics.map((t) => <SkillTag key={t} label={t} variant="neutral" />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* COVER LETTER TAB */}
        {activeTab === "cover-letter" && (
          <div className="space-y-4 max-w-3xl animate-fade-in">
            {vacancy.coverLetter ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: "hsl(0 0% 98%)" }}>Generated Cover Letter</h3>
                  <div className="flex items-center gap-2">
                    <CopyButton text={vacancy.coverLetter} />
                    <button
                      onClick={() => generateCoverLetter.mutate(vacancy.id)}
                      disabled={generateCoverLetter.isPending}
                      className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors hover:bg-[hsl(240_4%_14%)]"
                      style={{ borderColor: "hsl(240 5% 18%)", color: "hsl(240 4% 65%)" }}
                    >
                      {generateCoverLetter.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Regenerate
                    </button>
                  </div>
                </div>
                <div
                  className="rounded-lg border p-5 text-sm whitespace-pre-wrap leading-relaxed"
                  style={{
                    backgroundColor: "hsl(240 6% 7%)",
                    borderColor: "hsl(240 5% 18%)",
                    color: "hsl(240 4% 65%)",
                  }}
                >
                  {vacancy.coverLetter}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border py-16 text-center" style={{ backgroundColor: "hsl(240 6% 7%)", borderColor: "hsl(240 5% 18%)" }}>
                <FileText className="h-10 w-10 mb-4" style={{ color: "hsl(240 4% 38%)" }} />
                <p className="text-sm font-medium mb-1" style={{ color: "hsl(0 0% 98%)" }}>No cover letter yet</p>
                <p className="text-xs mb-6 max-w-xs" style={{ color: "hsl(240 4% 38%)" }}>
                  Generate a personalized cover letter using your profile and this job's AI analysis.
                </p>
                <button
                  onClick={() => generateCoverLetter.mutate(vacancy.id)}
                  disabled={generateCoverLetter.isPending}
                  className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "hsl(263 70% 58%)", color: "white" }}
                >
                  {generateCoverLetter.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generate Cover Letter</>
                  )}
                </button>
                {generateCoverLetter.error && (
                  <p className="mt-3 text-xs" style={{ color: "hsl(0 72% 61%)" }}>
                    {generateCoverLetter.error.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
