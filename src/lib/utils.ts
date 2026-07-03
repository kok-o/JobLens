import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// =============================================================================
// cn — className utility
// Merges Tailwind classes intelligently, resolving conflicts (e.g. p-4 + p-2 → p-2)
// Usage: cn("base-class", condition && "conditional-class", props.className)
// =============================================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =============================================================================
// formatSalary — formats a salary range into a human-readable string
// =============================================================================
export function formatSalary(
  from: number | null | undefined,
  to: number | null | undefined,
  currency: string | null | undefined = "KZT"
): string {
  if (!from && !to) return "Salary not specified";

  const fmt = (n: number) =>
    new Intl.NumberFormat("ru-KZ", { maximumFractionDigits: 0 }).format(n);

  const symbol =
    currency === "KZT" ? "₸" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency ?? "";

  if (from && to) return `${fmt(from)} – ${fmt(to)} ${symbol}`;
  if (from) return `from ${fmt(from)} ${symbol}`;
  return `up to ${fmt(to!)} ${symbol}`;
}

// =============================================================================
// scoreToVariant — maps a match score to a semantic color variant
// =============================================================================
export function scoreToVariant(score: number | null | undefined): "high" | "mid" | "low" | "unknown" {
  if (score === null || score === undefined) return "unknown";
  if (score >= 80) return "high";
  if (score >= 50) return "mid";
  return "low";
}

// =============================================================================
// scoreToLabel — human-readable match label
// =============================================================================
export function scoreToLabel(score: number | null | undefined): string {
  const variant = scoreToVariant(score);
  const labels = {
    high: "Strong Match",
    mid: "Partial Match",
    low: "Low Match",
    unknown: "Not analyzed",
  };
  return labels[variant];
}

// =============================================================================
// recommendationToLabel — maps recommendation to UI label
// =============================================================================
export function recommendationToLabel(rec: string | null | undefined): string {
  if (!rec) return "—";
  const labels: Record<string, string> = {
    apply: "Apply Now",
    maybe: "Consider Applying",
    skip: "Not Recommended",
  };
  return labels[rec] ?? rec;
}

// =============================================================================
// workFormatToLabel — normalizes work format strings
// =============================================================================
export function workFormatToLabel(format: string | null | undefined): string {
  if (!format) return "Not specified";
  const labels: Record<string, string> = {
    remote: "Remote",
    hybrid: "Hybrid",
    office: "Office",
    fullDay: "Office",
    flexible: "Flexible",
  };
  return labels[format] ?? format;
}

// =============================================================================
// timeAgo — human-readable relative time
// =============================================================================
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// =============================================================================
// truncate — truncate text to a max length with ellipsis
// =============================================================================
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}
