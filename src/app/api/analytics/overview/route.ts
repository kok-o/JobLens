// =============================================================================
// GET /api/analytics/overview — Aggregate analytics stats
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

  const userId = user.id;

  // Fetch all analyzed vacancies for aggregation
  const vacancies = await prisma.vacancy.findMany({
    where: { userId, matchScore: { not: null } },
    select: {
      matchScore: true,
      requiredSkills: true,
      techStack: true,
      workFormat: true,
      salaryFrom: true,
      salaryTo: true,
      salaryCurrency: true,
      recommendation: true,
      createdAt: true,
      status: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // --- Skill frequency ---
  const skillCounts: Record<string, number> = {};
  const techCounts: Record<string, number> = {};
  const formatCounts: Record<string, number> = { remote: 0, hybrid: 0, office: 0 };
  const timelineMap: Record<string, number> = {};
  const salaries: number[] = [];

  for (const v of vacancies) {
    // Skills
    for (const s of v.requiredSkills) {
      skillCounts[s] = (skillCounts[s] ?? 0) + 1;
    }
    // Tech
    for (const t of v.techStack) {
      techCounts[t] = (techCounts[t] ?? 0) + 1;
    }
    // Work format
    if (v.workFormat && v.workFormat in formatCounts) {
      formatCounts[v.workFormat]++;
    }
    // Timeline — group by week (YYYY-WW)
    const d = new Date(v.createdAt);
    const weekKey = `${d.getFullYear()}-${String(getISOWeek(d)).padStart(2, "0")}`;
    timelineMap[weekKey] = (timelineMap[weekKey] ?? 0) + 1;
    // Salary
    if (v.salaryFrom) salaries.push(v.salaryFrom);
    if (v.salaryTo) salaries.push(v.salaryTo);
  }

  const topSkills = Object.entries(skillCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([skill, count]) => ({ skill, count }));

  const topTech = Object.entries(techCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([tech, count]) => ({ tech, count }));

  const timeline = Object.entries(timelineMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));

  const avgSalary = salaries.length > 0
    ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
    : null;

  return NextResponse.json({
    data: {
      totalVacancies: vacancies.length,
      avgScore: vacancies.length > 0
        ? Math.round(vacancies.reduce((sum, v) => sum + (v.matchScore ?? 0), 0) / vacancies.length)
        : null,
      topSkills,
      topTech,
      workFormatDist: formatCounts,
      timeline,
      avgSalary,
      applied: vacancies.filter((v) => v.status === "applied").length,
      highMatch: vacancies.filter((v) => (v.matchScore ?? 0) >= 80).length,
    },
  });
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
