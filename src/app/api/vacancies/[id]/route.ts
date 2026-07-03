// =============================================================================
// GET /api/vacancies/[id]  — Single vacancy detail
// PATCH /api/vacancies/[id] — Update status or favorite
// DELETE /api/vacancies/[id] — Delete vacancy
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// Shared: auth + ownership check
async function getAuthedUser(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getVacancyOrFail(id: string, userId: string) {
  const vacancy = await prisma.vacancy.findFirst({
    where: { id, userId },
  });
  return vacancy;
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

  const { id } = await params;
  const vacancy = await getVacancyOrFail(id, user.id);
  if (!vacancy) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Vacancy not found" } }, { status: 404 });

  // Auto-mark as viewed on first open
  if (vacancy.status === "new") {
    await prisma.vacancy.update({ where: { id }, data: { status: "viewed" } });
    return NextResponse.json({ data: { ...vacancy, status: "viewed" } });
  }

  return NextResponse.json({ data: vacancy });
}

// ---------------------------------------------------------------------------
// PATCH
// ---------------------------------------------------------------------------

const PatchSchema = z.object({
  status: z.enum(["new", "viewed", "applied", "rejected"]).optional(),
  isFavorite: z.boolean().optional(),
}).refine(
  (data) => data.status !== undefined || data.isFavorite !== undefined,
  { message: "At least one field (status or isFavorite) must be provided" }
);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

  const { id } = await params;
  const existing = await getVacancyOrFail(id, user.id);
  if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Vacancy not found" } }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const result = PatchSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: result.error.message } }, { status: 400 });
  }

  const updated = await prisma.vacancy.update({
    where: { id },
    data: {
      ...(result.data.status !== undefined ? { status: result.data.status } : {}),
      ...(result.data.isFavorite !== undefined ? { isFavorite: result.data.isFavorite } : {}),
    },
  });

  return NextResponse.json({ data: updated });
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });

  const { id } = await params;
  const existing = await getVacancyOrFail(id, user.id);
  if (!existing) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Vacancy not found" } }, { status: 404 });

  await prisma.vacancy.delete({ where: { id } });
  return NextResponse.json({ data: { deleted: true } });
}
