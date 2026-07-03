// =============================================================================
// Telegram Notification Service
//
// Sends a formatted message when a high-scoring vacancy is ingested.
// Uses the Telegram Bot API (sendMessage).
// =============================================================================

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface VacancyNotification {
  title: string;
  company: string;
  score: number;
  recommendation: "apply" | "maybe" | "skip";
  url: string;
  vacancyUrl: string; // Link to the app's vacancy detail page
  salaryFrom?: number | null;
  salaryTo?: number | null;
  salaryCurrency?: string | null;
  city?: string | null;
}

// Score → emoji mapping
function scoreEmoji(score: number): string {
  if (score >= 80) return "🟢";
  if (score >= 60) return "🟡";
  return "🔴";
}

function recommendEmoji(rec: string): string {
  const map: Record<string, string> = { apply: "✅", maybe: "🤔", skip: "❌" };
  return map[rec] ?? "❓";
}

function formatSalaryText(
  from?: number | null,
  to?: number | null,
  currency?: string | null
): string {
  if (!from && !to) return "Not specified";
  const fmt = (n: number) =>
    new Intl.NumberFormat("ru", { maximumFractionDigits: 0 }).format(n);
  const sym = currency === "KZT" ? "₸" : currency ?? "";
  if (from && to) return `${fmt(from)} – ${fmt(to)} ${sym}`;
  if (from) return `from ${fmt(from)} ${sym}`;
  return `up to ${fmt(to!)} ${sym}`;
}

export async function sendVacancyNotification(
  config: TelegramConfig,
  vacancy: VacancyNotification
): Promise<{ ok: boolean; error?: string }> {
  const emoji = scoreEmoji(vacancy.score);
  const recEmoji = recommendEmoji(vacancy.recommendation);
  const salary = formatSalaryText(vacancy.salaryFrom, vacancy.salaryTo, vacancy.salaryCurrency);
  const location = vacancy.city ? ` · ${vacancy.city}` : "";

  const text = `${emoji} *New Match: ${vacancy.score}/100*

*${escapeMarkdown(vacancy.title)}*
${escapeMarkdown(vacancy.company)}${location}

💰 ${salary}
${recEmoji} Recommendation: *${vacancy.recommendation.toUpperCase()}*

[View on HeadHunter](${vacancy.url}) · [Open in App](${vacancy.vacancyUrl})`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${config.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.chatId,
          text,
          parse_mode: "Markdown",
          disable_web_page_preview: false,
        }),
      }
    );

    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.description ?? "Telegram API error" };
    }
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { ok: false, error };
  }
}

/**
 * Test the Telegram connection by sending a test message.
 */
export async function testTelegramConnection(
  config: TelegramConfig
): Promise<{ ok: boolean; error?: string }> {
  return sendVacancyNotification(config, {
    title: "Test Vacancy",
    company: "AI Job Assistant",
    score: 85,
    recommendation: "apply",
    url: "https://hh.ru",
    vacancyUrl: "https://your-app.vercel.app/vacancies",
  });
}

// Escape Markdown special chars in Telegram MarkdownV1 mode
function escapeMarkdown(text: string): string {
  // Only escape underscores and backticks which conflict with markdown
  return text.replace(/[_`]/g, (c) => `\\${c}`);
}
