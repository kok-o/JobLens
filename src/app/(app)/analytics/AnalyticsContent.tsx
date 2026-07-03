"use client";

// =============================================================================
// Analytics Page — Full Implementation (Phase 5)
//
// Charts (Recharts):
//   1. Overview stat cards
//   2. Vacancies Timeline (line chart, weekly)
//   3. Top Required Skills (bar chart, horizontal)
//   4. Tech Stack Frequency (horizontal bar)
//   5. Work Format Distribution (donut/pie chart)
// =============================================================================

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { BarChart3, TrendingUp, Target, CheckCircle2, Briefcase, Star } from "lucide-react";
import { useAnalytics } from "@/hooks/useQueries";
import { LoadingSpinner, StatCardSkeleton } from "@/components/shared/Skeletons";
import { EmptyState } from "@/components/shared/EmptyState";

// ---------------------------------------------------------------------------
// Design tokens for charts
// ---------------------------------------------------------------------------
const ACCENT = "hsl(263, 70%, 58%)";
const SUCCESS = "hsl(142, 71%, 45%)";
const WARNING = "hsl(38, 92%, 50%)";
const ERROR = "hsl(0, 72%, 51%)";
const INFO = "hsl(217, 91%, 60%)";
const MUTED = "hsl(240, 4%, 38%)";
const BG_ELEVATED = "hsl(240, 6%, 7%)";
const BORDER = "hsl(240, 5%, 18%)";
const TEXT_PRIMARY = "hsl(0, 0%, 98%)";
const TEXT_SECONDARY = "hsl(240, 4%, 65%)";

const FORMAT_COLORS: Record<string, string> = {
  remote: SUCCESS,
  hybrid: WARNING,
  office: INFO,
};

const BAR_COLORS = [ACCENT, INFO, SUCCESS, WARNING, ERROR, "hsl(280,70%,60%)", "hsl(320,70%,55%)"];

// ---------------------------------------------------------------------------
// Chart wrapper
// ---------------------------------------------------------------------------
function ChartCard({ title, subtitle, children, minHeight = 240 }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  minHeight?: number;
}) {
  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: BG_ELEVATED, borderColor: BORDER }}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>{title}</h3>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: MUTED }}>{subtitle}</p>}
      </div>
      <div style={{ minHeight }}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview stat cards (reused from dashboard but inline)
// ---------------------------------------------------------------------------
function AnalyticStatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-4" style={{ backgroundColor: BG_ELEVATED, borderColor: BORDER }}>
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color ?? ACCENT}1a` }}
      >
        <Icon className="h-4 w-4" style={{ color: color ?? ACCENT }} />
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: MUTED }}>{label}</p>
        <p className="text-xl font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>{value}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-sm shadow-lg"
      style={{ backgroundColor: "hsl(240 5% 11%)", borderColor: BORDER }}
    >
      {label && <p className="text-xs mb-1" style={{ color: MUTED }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-medium" style={{ color: p.color || TEXT_PRIMARY }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function AnalyticsContent() {
  const { data: raw, isLoading } = useAnalytics();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const analytics = raw as any;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: TEXT_PRIMARY }}>Analytics</h1>
          <p className="mt-1 text-sm" style={{ color: TEXT_SECONDARY }}>Loading your data…</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (!analytics || analytics.totalVacancies === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-6" style={{ color: TEXT_PRIMARY }}>Analytics</h1>
        <EmptyState
          icon={BarChart3}
          title="No data yet"
          description="Analytics will populate once vacancies have been analyzed."
        />
      </div>
    );
  }

  // Format timeline data
  const timeline = (analytics.timeline ?? []) as Array<{ week: string; count: number }>;
  const topSkills = (analytics.topSkills ?? []) as Array<{ skill: string; count: number }>;
  const topTech = (analytics.topTech ?? []) as Array<{ tech: string; count: number }>;
  const formatDist = analytics.workFormatDist as Record<string, number> ?? {};

  const pieData = Object.entries(formatDist)
    .filter(([, v]) => (v as number) > 0)
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: value as number,
      color: FORMAT_COLORS[key] ?? MUTED,
    }));

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: TEXT_PRIMARY }}>Analytics</h1>
        <p className="mt-1 text-sm" style={{ color: TEXT_SECONDARY }}>
          Based on {analytics.totalVacancies} analyzed vacancies
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <AnalyticStatCard label="Total Analyzed" value={analytics.totalVacancies} icon={Briefcase} />
        <AnalyticStatCard
          label="Avg Match Score"
          value={analytics.avgScore != null ? `${analytics.avgScore}/100` : "—"}
          icon={Target}
          color={ACCENT}
        />
        <AnalyticStatCard
          label="High Match (≥80)"
          value={analytics.highMatch ?? 0}
          icon={Star}
          color={SUCCESS}
        />
        <AnalyticStatCard
          label="Applied"
          value={analytics.applied ?? 0}
          icon={CheckCircle2}
          color={INFO}
        />
        {analytics.avgSalary && (
          <AnalyticStatCard
            label="Avg Salary"
            value={new Intl.NumberFormat("ru").format(analytics.avgSalary)}
            icon={TrendingUp}
            color={WARNING}
          />
        )}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Vacancies Timeline */}
        {timeline.length > 0 && (
          <ChartCard
            title="Vacancies Over Time"
            subtitle="Weekly — how many vacancies were ingested each week"
            minHeight={200}
          >
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timeline} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: MUTED, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: MUTED, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Vacancies"
                  stroke={ACCENT}
                  strokeWidth={2.5}
                  dot={{ fill: ACCENT, r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: ACCENT }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Work Format Donut */}
        {pieData.length > 0 && (
          <ChartCard
            title="Work Format Distribution"
            subtitle="Remote vs Hybrid vs Office"
            minHeight={200}
          >
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "12px", color: TEXT_SECONDARY }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Top Skills */}
        {topSkills.length > 0 && (
          <ChartCard
            title="Top Required Skills"
            subtitle="Most frequently demanded skills across all vacancies"
            minHeight={300}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topSkills.slice(0, 12)}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: MUTED, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="skill"
                  type="category"
                  width={100}
                  tick={{ fill: TEXT_SECONDARY, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Vacancies" radius={[0, 4, 4, 0]} maxBarSize={16}>
                  {topSkills.slice(0, 12).map((_, index) => (
                    <Cell
                      key={index}
                      fill={BAR_COLORS[index % BAR_COLORS.length]}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Tech Stack */}
        {topTech.length > 0 && (
          <ChartCard
            title="Tech Stack Frequency"
            subtitle="Technologies most commonly listed in job postings"
            minHeight={300}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topTech.slice(0, 10)}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: MUTED, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="tech"
                  type="category"
                  width={100}
                  tick={{ fill: TEXT_SECONDARY, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Vacancies" radius={[0, 4, 4, 0]} maxBarSize={16} fill={INFO} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
}
