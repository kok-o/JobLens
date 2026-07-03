// =============================================================================
// Shared TypeScript Types — AI Job Assistant
//
// These are the canonical types used across the entire application.
// API responses, component props, and store state all reference these.
// =============================================================================

// ---------------------------------------------------------------------------
// Vacancy
// ---------------------------------------------------------------------------

export type WorkFormat = "remote" | "hybrid" | "office";
export type VacancyStatus = "new" | "viewed" | "applied" | "rejected";
export type Recommendation = "apply" | "maybe" | "skip";
export type SourceName = "headhunter" | "remoteok" | "rss" | "telegram";
export type AIProvider = "openai" | "gemini" | "claude";

export interface ScoreBreakdown {
  skills: number;     // 0–40
  tech: number;       // 0–25
  experience: number; // 0–20
  salary: number;     // 0–10
  format: number;     // 0–5
}

export interface Vacancy {
  id: string;
  userId: string;

  // Source
  sourceId: string;
  sourceName: SourceName;
  url: string;
  publishedAt: string | null;

  // Raw data
  title: string;
  company: string;
  companyLogo: string | null;
  descriptionRaw: string | null;
  salaryFrom: number | null;
  salaryTo: number | null;
  salaryCurrency: string | null;
  workFormat: WorkFormat | null;
  experienceReq: string | null;
  city: string | null;

  // AI extracted
  requiredSkills: string[];
  niceToHave: string[];
  techStack: string[];

  // AI analysis
  aiSummary: string | null;
  matchScore: number | null;
  scoreBreakdown: ScoreBreakdown | null;
  pros: string[];
  cons: string[];
  missingSkills: string[];
  salaryFit: boolean | null;
  recommendation: Recommendation | null;
  interviewTopics: string[];

  // Cover letter (on-demand)
  coverLetter: string | null;

  // User actions
  status: VacancyStatus;
  isFavorite: boolean;

  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface ExperienceEntry {
  role: string;
  company: string;
  years: number;
  description?: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string | null;
  summary: string | null;
  skills: string[];
  technologies: string[];
  experience: ExperienceEntry[];
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  workFormats: WorkFormat[];
  languages: string[];
  cities: string[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface Settings {
  id: string;
  userId: string;
  aiProvider: AIProvider;
  aiModel: string;
  openaiKey: string | null;
  geminiKey: string | null;
  claudeKey: string | null;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  hhSearchText: string;
  hhArea: string;
  hhPerPage: number;
  notifyMinScore: number;
  promptAnalysis: string | null;
  promptCoverLetter: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Dashboard Stats
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalAnalyzed: number;
  newToday: number;
  avgScore: number | null;
  bestMatch: {
    score: number;
    title: string;
    company: string;
    vacancyId: string;
  } | null;
  savedCount: number;
  appliedCount: number;
  // Deltas vs yesterday
  newTodayDelta: number;
  avgScoreDelta: number | null;
}

// ---------------------------------------------------------------------------
// API Response Wrappers
// ---------------------------------------------------------------------------

export interface ApiSuccess<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ---------------------------------------------------------------------------
// Vacancy Filters (used by Zustand filter store)
// ---------------------------------------------------------------------------

export interface VacancyFilters {
  search: string;
  scoreMin: number;
  scoreMax: number;
  workFormats: WorkFormat[];
  statuses: VacancyStatus[];
  isFavorite: boolean | null;
  cities: string[];
  sort: "score_desc" | "date_desc" | "salary_desc";
  page: number;
  limit: number;
}

export const DEFAULT_FILTERS: VacancyFilters = {
  search: "",
  scoreMin: 0,
  scoreMax: 100,
  workFormats: [],
  statuses: [],
  isFavorite: null,
  cities: [],
  sort: "score_desc",
  page: 1,
  limit: 20,
};

// ---------------------------------------------------------------------------
// AI Analysis — raw response from LLM (before DB save)
// ---------------------------------------------------------------------------

export interface AIAnalysisResult {
  summary: string;
  required_skills: string[];
  nice_to_have: string[];
  tech_stack: string[];
  score: number;
  score_breakdown: ScoreBreakdown;
  pros: string[];
  cons: string[];
  missing_skills: string[];
  salary_fit: boolean;
  recommendation: Recommendation;
  interview_topics: string[];
}
