// =============================================================================
// GET /api/profile  — Get current user profile
// PUT /api/profile  — Update profile
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const ExperienceEntrySchema = z.object({
  role: z.string().min(1),
  company: z.string().min(1),
  years: z.number().min(0).max(50),
  description: z.string().optional(),
});

const ProfileUpdateSchema = z.object({
  name: z.string().max(100).optional().nullable(),
  summary: z.string().max(1000).optional().nullable(),
  skills: z.array(z.string().max(50)).max(50).optional(),
  technologies: z.array(z.string().max(50)).max(50).optional(),
  experience: z.array(ExperienceEntrySchema).max(20).optional(),
  salaryMin: z.number().int().positive().optional().nullable(),
  salaryMax: z.number().int().positive().optional().nullable(),
  currency: z.enum(["KZT", "USD", "EUR", "RUB"]).optional(),
  workFormats: z.array(z.enum(["remote", "hybrid", "office"])).optional(),
  languages: z.array(z.string().max(30)).max(10).optional(),
  cities: z.array(z.string().max(50)).max(10).optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

  let profile = await prisma.profile.findUnique({ where: { userId: user.id } });

  // Auto-create profile on first access
  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId: user.id,
        skills: [],
        technologies: [],
        experience: [],
        workFormats: [],
        languages: [],
        cities: [],
      },
    });
  }

  return NextResponse.json({ data: profile });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const result = ProfileUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: result.error.message } }, { status: 400 });
  }

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...result.data,
      skills: result.data.skills ?? [],
      technologies: result.data.technologies ?? [],
      experience: result.data.experience ?? [],
      workFormats: result.data.workFormats ?? [],
      languages: result.data.languages ?? [],
      cities: result.data.cities ?? [],
    },
    update: result.data,
  });

  return NextResponse.json({ data: profile });
}
