// =============================================================================
// GET /api/dashboard/stats
//
// Aggregates the 6 Quick Stats Bar metrics in one query.
// Called on every dashboard load (TanStack Query caches it).
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { DashboardStats } from "@/types";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

  const userId = user.id;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  // Run all queries in parallel
  const [
    totalAnalyzed,
    newToday,
    newYesterday,
    avgScoreResult,
    avgScoreYesterdayResult,
    bestMatchResult,
    savedCount,
    appliedCount,
  ] = await Promise.all([
    prisma.vacancy.count({ where: { userId } }),
    prisma.vacancy.count({ where: { userId, createdAt: { gte: todayStart } } }),
    prisma.vacancy.count({ where: { userId, createdAt: { gte: yesterdayStart, lt: todayStart } } }),
    prisma.vacancy.aggregate({ where: { userId, matchScore: { not: null } }, _avg: { matchScore: true } }),
    prisma.vacancy.aggregate({
      where: { userId, matchScore: { not: null }, createdAt: { lt: todayStart } },
      _avg: { matchScore: true },
    }),
    prisma.vacancy.findFirst({
      where: { userId, matchScore: { not: null } },
      orderBy: { matchScore: "desc" },
      select: { id: true, matchScore: true, title: true, company: true },
    }),
    prisma.vacancy.count({ where: { userId, isFavorite: true } }),
    prisma.vacancy.count({ where: { userId, status: "applied" } }),
  ]);

  const avgScore = avgScoreResult._avg.matchScore
    ? Math.round(avgScoreResult._avg.matchScore)
    : null;
  const avgScoreYesterday = avgScoreYesterdayResult._avg.matchScore
    ? Math.round(avgScoreYesterdayResult._avg.matchScore)
    : null;

  const stats: DashboardStats = {
    totalAnalyzed,
    newToday,
    avgScore,
    bestMatch: bestMatchResult
      ? {
          score: bestMatchResult.matchScore!,
          title: bestMatchResult.title,
          company: bestMatchResult.company,
          vacancyId: bestMatchResult.id,
        }
      : null,
    savedCount,
    appliedCount,
    newTodayDelta: newToday - newYesterday,
    avgScoreDelta:
      avgScore !== null && avgScoreYesterday !== null ? avgScore - avgScoreYesterday : null,
  };

  return NextResponse.json({ data: stats });
}
