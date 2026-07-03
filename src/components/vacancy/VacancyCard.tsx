"use client";

// =============================================================================
// VacancyCard — Card component for vacancy list
//
// Shows: score ring, title/company, meta badges, top 3 skills, salary
// Actions: favorite toggle, open detail
// =============================================================================

import { useRouter } from "next/navigation";
import { MapPin, Briefcase, Heart, ExternalLink, Clock } from "lucide-react";
import { ScoreBadge } from "./ScoreBadge";
import { SkillTag } from "./SkillTag";
import { formatSalary, workFormatToLabel, timeAgo } from "@/lib/utils";
import type { Vacancy } from "@/types";

interface VacancyCardProps {
  vacancy: Vacancy;
  onFavoriteToggle?: (id: string, current: boolean) => void;
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: "hsl(263 70% 58%)",
  viewed: "hsl(240 4% 38%)",
  applied: "hsl(142 71% 45%)",
  rejected: "hsl(0 72% 51%)",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  viewed: "Viewed",
  applied: "Applied",
  rejected: "Rejected",
};

export function VacancyCard({ vacancy, onFavoriteToggle, className }: VacancyCardProps) {
  const router = useRouter();
  const salary = formatSalary(vacancy.salaryFrom, vacancy.salaryTo, vacancy.salaryCurrency);
  const hasSalary = vacancy.salaryFrom || vacancy.salaryTo;

  return (
    <div
      className={`group relative flex flex-col gap-3 rounded-xl border p-4 cursor-pointer
        transition-all duration-150 hover:border-[hsl(263_70%_58%/0.3)] hover:bg-[hsl(240_5%_9%)]
        animate-fade-up ${className ?? ""}`}
      style={{
        backgroundColor: "hsl(240 6% 7%)",
        borderColor: "hsl(240 5% 18%)",
      }}
      onClick={() => router.push(`/vacancies/${vacancy.id}`)}
      role="article"
      aria-label={`${vacancy.title} at ${vacancy.company}`}
    >
      {/* --- Top row: score + title + favorite --- */}
      <div className="flex items-start gap-3">
        <ScoreBadge score={vacancy.matchScore} size="sm" />

        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-semibold truncate leading-tight"
            style={{ color: "hsl(0 0% 98%)" }}
          >
            {vacancy.title}
          </h3>
          <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(240 4% 65%)" }}>
            {vacancy.company}
          </p>
        </div>

        <button
          className="flex-shrink-0 p-1.5 rounded-md transition-colors hover:bg-[hsl(240_4%_14%)]"
          style={{ color: vacancy.isFavorite ? "hsl(0 72% 51%)" : "hsl(240 4% 38%)" }}
          aria-label={vacancy.isFavorite ? "Remove from saved" : "Save vacancy"}
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle?.(vacancy.id, vacancy.isFavorite);
          }}
        >
          <Heart className="h-3.5 w-3.5" fill={vacancy.isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      {/* --- Meta badges --- */}
      <div className="flex flex-wrap gap-1.5">
        {vacancy.workFormat && (
          <MetaBadge icon={<Briefcase className="h-2.5 w-2.5" />} label={workFormatToLabel(vacancy.workFormat)} />
        )}
        {vacancy.city && (
          <MetaBadge icon={<MapPin className="h-2.5 w-2.5" />} label={vacancy.city} />
        )}
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
          style={{
            backgroundColor: `${STATUS_COLORS[vacancy.status] ?? "hsl(240 4% 38%)"}18`,
            color: STATUS_COLORS[vacancy.status] ?? "hsl(240 4% 38%)",
            borderColor: `${STATUS_COLORS[vacancy.status] ?? "hsl(240 4% 38%)"}40`,
          }}
        >
          {STATUS_LABELS[vacancy.status] ?? vacancy.status}
        </span>
      </div>

      {/* --- Required skills (top 3) --- */}
      {vacancy.requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {vacancy.requiredSkills.slice(0, 3).map((skill) => (
            <SkillTag key={skill} label={skill} variant="required" />
          ))}
          {vacancy.requiredSkills.length > 3 && (
            <span className="text-xs" style={{ color: "hsl(240 4% 38%)" }}>
              +{vacancy.requiredSkills.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* --- Bottom row: salary + time --- */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium"
          style={{ color: hasSalary ? "hsl(0 0% 98%)" : "hsl(240 4% 38%)" }}
        >
          {salary}
        </span>
        <div className="flex items-center gap-1" style={{ color: "hsl(240 4% 38%)" }}>
          <Clock className="h-2.5 w-2.5" />
          <span className="text-xs">{timeAgo(vacancy.createdAt)}</span>
        </div>
      </div>

      {/* External link indicator */}
      <ExternalLink
        className="absolute top-3 right-10 h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity"
        style={{ color: "hsl(240 4% 65%)" }}
      />
    </div>
  );
}

function MetaBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
      style={{
        backgroundColor: "hsl(240 4% 14%)",
        color: "hsl(240 4% 65%)",
        borderColor: "hsl(240 5% 22%)",
      }}
    >
      {icon}
      {label}
    </span>
  );
}
