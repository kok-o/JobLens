"use client";

// =============================================================================
// Vacancies List Page — Full Implementation (Phase 3)
// Search + Filters + Sort + Pagination + Vacancy Cards
// =============================================================================

import { useCallback, useState } from "react";
import { Search, SlidersHorizontal, X, BriefcaseBusiness, ChevronLeft, ChevronRight } from "lucide-react";
import { useVacancies, useToggleFavorite } from "@/hooks/useQueries";
import { useUIStore } from "@/stores/uiStore";
import { VacancyCard } from "@/components/vacancy/VacancyCard";
import { VacancyCardSkeleton } from "@/components/shared/Skeletons";
import { EmptyState } from "@/components/shared/EmptyState";
import type { WorkFormat, VacancyStatus } from "@/types";

const WORK_FORMATS: { value: WorkFormat; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "office", label: "Office" },
];

const STATUSES: { value: VacancyStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "viewed", label: "Viewed" },
  { value: "applied", label: "Applied" },
  { value: "rejected", label: "Rejected" },
];

const SORT_OPTIONS = [
  { value: "score_desc", label: "Best Match" },
  { value: "date_desc", label: "Latest" },
  { value: "salary_desc", label: "Highest Salary" },
] as const;

export function VacanciesContent() {
  const { filters, setFilter, resetFilters } = useUIStore();
  const [searchInput, setSearchInput] = useState(filters.search);
  const [showFilters, setShowFilters] = useState(false);
  const toggleFavorite = useToggleFavorite();

  const { data, isLoading } = useVacancies(filters);
  const vacancies = data?.data ?? [];
  const meta = data?.meta;

  // Debounced search
  const handleSearch = useCallback((val: string) => {
    setSearchInput(val);
    const timer = setTimeout(() => setFilter("search", val), 300);
    return () => clearTimeout(timer);
  }, [setFilter]);

  const hasActiveFilters =
    filters.search ||
    filters.workFormats.length > 0 ||
    filters.statuses.length > 0 ||
    filters.isFavorite !== null ||
    filters.scoreMin > 0 ||
    filters.scoreMax < 100;

  return (
    <div className="flex h-full">
      {/* ─── Filter Sidebar ─── */}
      {showFilters && (
        <aside
          className="w-64 flex-shrink-0 border-r h-full overflow-y-auto p-4 space-y-6"
          style={{ backgroundColor: "hsl(240 6% 7%)", borderColor: "hsl(240 5% 18%)" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: "hsl(0 0% 98%)" }}>Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs transition-colors hover:opacity-70"
                style={{ color: "hsl(263 70% 68%)" }}
              >
                Reset all
              </button>
            )}
          </div>

          {/* Score range */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(240 4% 38%)" }}>
              Min Score
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={filters.scoreMin}
                onChange={(e) => setFilter("scoreMin", Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs w-8 text-right" style={{ color: "hsl(0 0% 98%)" }}>{filters.scoreMin}</span>
            </div>
          </div>

          {/* Work format */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(240 4% 38%)" }}>
              Work Format
            </label>
            {WORK_FORMATS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.workFormats.includes(value)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...filters.workFormats, value]
                      : filters.workFormats.filter((f) => f !== value);
                    setFilter("workFormats", next);
                  }}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: "hsl(240 4% 65%)" }}>{label}</span>
              </label>
            ))}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "hsl(240 4% 38%)" }}>
              Status
            </label>
            {STATUSES.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.statuses.includes(value)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...filters.statuses, value]
                      : filters.statuses.filter((s) => s !== value);
                    setFilter("statuses", next);
                  }}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: "hsl(240 4% 65%)" }}>{label}</span>
              </label>
            ))}
          </div>

          {/* Favorites only */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isFavorite === true}
                onChange={(e) => setFilter("isFavorite", e.target.checked ? true : null)}
                className="rounded"
              />
              <span className="text-sm" style={{ color: "hsl(240 4% 65%)" }}>Saved only</span>
            </label>
          </div>
        </aside>
      )}

      {/* ─── Main Content ─── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "hsl(0 0% 98%)" }}>
                Vacancies
              </h1>
              <p className="mt-1 text-sm" style={{ color: "hsl(240 4% 65%)" }}>
                {meta ? `${meta.total} vacancies found` : "All analyzed vacancies"}
              </p>
            </div>
          </div>

          {/* Search + Controls bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "hsl(240 4% 38%)" }}
              />
              <input
                id="vacancy-search"
                type="search"
                placeholder="Search vacancies..."
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-md border bg-transparent pl-9 pr-4 py-2 text-sm outline-none transition-colors
                  focus:border-[hsl(263_70%_58%)] placeholder:text-[hsl(240_4%_38%)]"
                style={{
                  borderColor: "hsl(240 5% 18%)",
                  color: "hsl(0 0% 98%)",
                }}
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(""); setFilter("search", ""); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(240 4% 38%)" }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => setFilter("sort", e.target.value as typeof filters.sort)}
              className="rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
              style={{
                borderColor: "hsl(240 5% 18%)",
                color: "hsl(240 4% 65%)",
                backgroundColor: "hsl(240 6% 7%)",
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} style={{ backgroundColor: "hsl(240 6% 7%)" }}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-[hsl(240_4%_14%)]"
              style={{
                borderColor: showFilters ? "hsl(263 70% 58% / 0.5)" : "hsl(240 5% 18%)",
                color: showFilters ? "hsl(263 70% 68%)" : "hsl(240 4% 65%)",
              }}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: "hsl(263 70% 58%)", color: "white" }}
                >
                  •
                </span>
              )}
            </button>
          </div>

          {/* Vacancy grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <VacancyCardSkeleton key={i} />)}
            </div>
          ) : vacancies.length === 0 ? (
            <EmptyState
              icon={BriefcaseBusiness}
              title={hasActiveFilters ? "No vacancies match your filters" : "No vacancies yet"}
              description={
                hasActiveFilters
                  ? "Try adjusting your filters or search query."
                  : "Your n8n workflow will ingest vacancies here automatically."
              }
              action={hasActiveFilters ? { label: "Reset Filters", onClick: resetFilters } : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {vacancies.map((vacancy) => (
                <VacancyCard
                  key={vacancy.id}
                  vacancy={vacancy}
                  onFavoriteToggle={(id, current) => toggleFavorite.mutate({ id, isFavorite: current })}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.total > meta.limit && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setFilter("page", filters.page - 1)}
                disabled={filters.page <= 1}
                className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-[hsl(240_4%_14%)] disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: "hsl(240 5% 18%)", color: "hsl(240 4% 65%)" }}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm" style={{ color: "hsl(240 4% 65%)" }}>
                Page {meta.page} of {Math.ceil(meta.total / meta.limit)}
              </span>
              <button
                onClick={() => setFilter("page", filters.page + 1)}
                disabled={!meta.hasMore}
                className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-[hsl(240_4%_14%)] disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: "hsl(240 5% 18%)", color: "hsl(240 4% 65%)" }}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
