"use client";

// =============================================================================
// Dashboard — Full Implementation (Phase 3)
// QuickStatsBar + Recent Vacancies + Score Distribution
// =============================================================================

import { useRouter } from "next/navigation";
import { LayoutDashboard, Briefcase, User, RefreshCw, ArrowRight, Star, CheckCircle2, Target, TrendingUp, Clock } from "lucide-react";
import { useDashboardStats, useVacancies } from "@/hooks/useQueries";
import { StatCard } from "@/components/dashboard/StatCard";
import { VacancyCard } from "@/components/vacancy/VacancyCard";
import { useToggleFavorite } from "@/hooks/useQueries";
import { StatCardSkeleton, VacancyCardSkeleton } from "@/components/shared/Skeletons";
import { EmptyState } from "@/components/shared/EmptyState";

export function DashboardContent() {
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentData, isLoading: recentLoading } = useVacancies({ limit: 5, sort: "date_desc" });
  const toggleFavorite = useToggleFavorite();

  const recentVacancies = recentData?.data ?? [];

  return (
    <div className="p-6 space-y-8 max-w-7xl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "hsl(0 0% 98%)" }}>
            Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: "hsl(240 4% 65%)" }}>
            Your job search at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/vacancies")}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium border transition-colors hover:bg-[hsl(240_4%_14%)]"
            style={{
              borderColor: "hsl(240 5% 18%)",
              color: "hsl(240 4% 65%)",
            }}
          >
            <Briefcase className="h-4 w-4" />
            All Vacancies
          </button>
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: "hsl(263 70% 58%)", color: "hsl(0 0% 100%)" }}
          >
            <User className="h-4 w-4" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* ─── Quick Stats Bar ─── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(240 4% 38%)" }}>
          Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statsLoading ? (
            Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard
                label="New Today"
                value={stats?.newToday ?? 0}
                delta={stats?.newTodayDelta ?? null}
                deltaLabel="vs yesterday"
              />
              <StatCard
                label="Avg Score"
                value={stats?.avgScore != null ? `${stats.avgScore}` : "—"}
                delta={stats?.avgScoreDelta ?? null}
                deltaLabel="pts vs yesterday"
              />
              <StatCard
                label="Best Match"
                value={stats?.bestMatch?.score != null ? `${stats.bestMatch.score}` : "—"}
                subtitle={stats?.bestMatch?.title ?? undefined}
                highlight
              />
              <StatCard
                label="Total Analyzed"
                value={stats?.totalAnalyzed ?? 0}
              />
              <StatCard
                label="Saved"
                value={stats?.savedCount ?? 0}
              />
              <StatCard
                label="Applied"
                value={stats?.appliedCount ?? 0}
              />
            </>
          )}
        </div>
      </section>

      {/* ─── Recent Vacancies ─── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(240 4% 38%)" }}>
            Recent Vacancies
          </h2>
          <button
            onClick={() => router.push("/vacancies")}
            className="flex items-center gap-1 text-xs transition-colors hover:opacity-70"
            style={{ color: "hsl(263 70% 68%)" }}
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {recentLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <VacancyCardSkeleton key={i} />)}
          </div>
        ) : recentVacancies.length === 0 ? (
          <EmptyState
            icon={LayoutDashboard}
            title="No vacancies yet"
            description="Set up your n8n workflow to start ingesting vacancies automatically."
            action={{ label: "Configure Settings", onClick: () => router.push("/settings") }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentVacancies.map((vacancy) => (
              <VacancyCard
                key={vacancy.id}
                vacancy={vacancy}
                onFavoriteToggle={(id, current) =>
                  toggleFavorite.mutate({ id, isFavorite: current })
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── Quick Actions ─── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "hsl(240 4% 38%)" }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Briefcase, label: "Browse Vacancies", sub: "Filter & search", href: "/vacancies" },
            { icon: Target, label: "Analytics", sub: "Skills & trends", href: "/analytics" },
            { icon: User, label: "Edit Profile", sub: "Update your CV data", href: "/profile" },
            { icon: RefreshCw, label: "Settings", sub: "AI provider & keys", href: "/settings" },
          ].map(({ icon: Icon, label, sub, href }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="flex items-start gap-3 rounded-xl border p-4 text-left transition-all hover:border-[hsl(263_70%_58%/0.3)] hover:bg-[hsl(240_5%_9%)]"
              style={{ backgroundColor: "hsl(240 6% 7%)", borderColor: "hsl(240 5% 18%)" }}
            >
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: "hsl(263 70% 58% / 0.1)" }}
              >
                <Icon className="h-4 w-4" style={{ color: "hsl(263 70% 58%)" }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: "hsl(0 0% 98%)" }}>{label}</p>
                <p className="text-xs" style={{ color: "hsl(240 4% 38%)" }}>{sub}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
