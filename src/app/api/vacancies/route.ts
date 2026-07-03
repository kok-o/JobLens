// =============================================================================
// GET /api/vacancies — List vacancies with filters, search, pagination
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

  const { searchParams } = req.nextUrl;

  // Parse filters
  const search = searchParams.get("search") ?? "";
  const scoreMin = Number(searchParams.get("score_min") ?? 0);
  const scoreMax = Number(searchParams.get("score_max") ?? 100);
  const workFormats = searchParams.get("work_format")?.split(",").filter(Boolean) ?? [];
  const statuses = searchParams.get("status")?.split(",").filter(Boolean) ?? [];
  const isFavoriteParam = searchParams.get("is_favorite");
  const cities = searchParams.get("city")?.split(",").filter(Boolean) ?? [];
  const sort = searchParams.get("sort") ?? "score_desc";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  // Build WHERE clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    userId: user.id,
    ...(scoreMin > 0 || scoreMax < 100
      ? { matchScore: { gte: scoreMin, lte: scoreMax } }
      : {}),
    ...(workFormats.length > 0 ? { workFormat: { in: workFormats } } : {}),
    ...(statuses.length > 0 ? { status: { in: statuses } } : {}),
    ...(isFavoriteParam !== null ? { isFavorite: isFavoriteParam === "true" } : {}),
    ...(cities.length > 0 ? { city: { in: cities } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
            { aiSummary: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  // Build ORDER BY
  const orderBy =
    sort === "date_desc"
      ? { createdAt: "desc" as const }
      : sort === "salary_desc"
        ? { salaryTo: "desc" as const }
        : { matchScore: "desc" as const };

  const [vacancies, total] = await Promise.all([
    prisma.vacancy.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        userId: true,
        sourceId: true,
        sourceName: true,
        url: true,
        publishedAt: true,
        title: true,
        company: true,
        companyLogo: true,
        salaryFrom: true,
        salaryTo: true,
        salaryCurrency: true,
        workFormat: true,
        experienceReq: true,
        city: true,
        requiredSkills: true,
        niceToHave: true,
        techStack: true,
        aiSummary: true,
        matchScore: true,
        scoreBreakdown: true,
        pros: true,
        cons: true,
        missingSkills: true,
        salaryFit: true,
        recommendation: true,
        interviewTopics: true,
        coverLetter: true,
        status: true,
        isFavorite: true,
        analyzedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.vacancy.count({ where }),
  ]);

  return NextResponse.json({
    data: vacancies,
    meta: { total, page, limit, hasMore: skip + limit < total },
  });
}
