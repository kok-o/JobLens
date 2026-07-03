// =============================================================================
// HeadHunter API Client (hh.ru)
//
// Thin, typed wrapper around the public HH API v1.
// Used in n8n (via webhook) OR can be called directly from a cron job.
//
// Docs: https://api.hh.ru/openapi/redoc
// Base: https://api.hh.ru/
//
// Note: HH does not require auth for vacancy search (public endpoint).
// =============================================================================

export interface HHSearchParams {
  text: string;           // Search query (supports OR)
  area?: string;          // Area/city code — 160 = Almaty, 1 = Moscow
  per_page?: number;      // Results per page (max 100)
  page?: number;          // Page number (0-indexed)
  only_with_salary?: boolean;
  schedule?: "remote" | "fullDay" | "shift" | "flexible"; // Work schedule filter
  experience?: "noExperience" | "between1And3" | "between3And6" | "moreThan6";
}

export interface HHSalary {
  from: number | null;
  to: number | null;
  currency: string;
  gross: boolean;
}

export interface HHVacancy {
  id: string;
  name: string;
  area: { id: string; name: string } | null;
  salary: HHSalary | null;
  employer: {
    id: string;
    name: string;
    logo_urls?: { "240"?: string; "90"?: string; original?: string } | null;
  };
  snippet: {
    requirement: string | null;     // Short description snippet
    responsibility: string | null;
  };
  schedule: { id: string; name: string } | null;
  experience: { id: string; name: string } | null;
  published_at: string;   // ISO 8601
  alternate_url: string;  // Human-readable URL on hh.ru
}

export interface HHSearchResult {
  items: HHVacancy[];
  found: number;
  pages: number;
  per_page: number;
  page: number;
}

export interface HHVacancyDetail extends HHVacancy {
  description: string; // Full HTML description
  key_skills: Array<{ name: string }>;
  employment: { id: string; name: string } | null;
}

// ---------------------------------------------------------------------------
// Work schedule → our WorkFormat mapping
// ---------------------------------------------------------------------------
export function hhScheduleToWorkFormat(schedule: string | null | undefined): "remote" | "hybrid" | "office" | null {
  if (!schedule) return null;
  const map: Record<string, "remote" | "hybrid" | "office"> = {
    remote: "remote",
    flyInFlyOut: "remote",
    flexible: "hybrid",
    shift: "office",
    fullDay: "office",
  };
  return map[schedule] ?? null;
}

// ---------------------------------------------------------------------------
// Strip HTML from HH descriptions (returns plain text)
// ---------------------------------------------------------------------------
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ---------------------------------------------------------------------------
// HH API Client
// ---------------------------------------------------------------------------

const HH_BASE = "https://api.hh.ru";
const HH_HEADERS = {
  "User-Agent": "AI-Job-Assistant/1.0 (job search automation)",
  "HH-User-Agent": "AI-Job-Assistant/1.0 (job search automation)",
};

export class HHClient {
  /**
   * Search vacancies — returns the list page (no full description).
   * Use fetchVacancyDetail() to get the full description + key skills.
   */
  async searchVacancies(params: HHSearchParams): Promise<HHSearchResult> {
    const query = new URLSearchParams();
    query.set("text", params.text);
    if (params.area) query.set("area", params.area);
    if (params.per_page) query.set("per_page", String(params.per_page));
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.only_with_salary) query.set("only_with_salary", "true");
    if (params.schedule) query.set("schedule", params.schedule);
    if (params.experience) query.set("experience", params.experience);

    const res = await fetch(`${HH_BASE}/vacancies?${query.toString()}`, {
      headers: HH_HEADERS,
      next: { revalidate: 300 }, // Cache for 5 minutes in Next.js fetch cache
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HH API error ${res.status}: ${text.slice(0, 200)}`);
    }

    return res.json() as Promise<HHSearchResult>;
  }

  /**
   * Fetch a single vacancy with full description + key skills.
   * Rate limited: ~1 req/sec is safe.
   */
  async fetchVacancyDetail(id: string): Promise<HHVacancyDetail> {
    const res = await fetch(`${HH_BASE}/vacancies/${id}`, {
      headers: HH_HEADERS,
    });

    if (!res.ok) {
      throw new Error(`HH vacancy ${id} not found (${res.status})`);
    }

    return res.json() as Promise<HHVacancyDetail>;
  }

  /**
   * Fetch multiple pages of vacancies in sequence (respects rate limits).
   * Returns all items across pages up to maxPages.
   */
  async fetchAllPages(params: HHSearchParams, maxPages = 5): Promise<HHVacancy[]> {
    const items: HHVacancy[] = [];
    let page = 0;

    while (page < maxPages) {
      const result = await this.searchVacancies({ ...params, page });
      items.push(...result.items);

      if (page >= result.pages - 1) break; // No more pages

      page++;
      // Polite delay between pages
      await new Promise((r) => setTimeout(r, 500));
    }

    return items;
  }
}

// Singleton instance
export const hhClient = new HHClient();
