/**
 * GET /api/actors  — list stock + user's custom actors with optional filters
 * POST /api/actors — upload a custom actor (Pro+ only)
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canUploadCustomActor, type PlanKey } from "@/lib/plans";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);

  const gender = url.searchParams.get("gender");
  const ageRange = url.searchParams.get("ageRange");
  const vibe = url.searchParams.get("vibe");
  const setting = url.searchParams.get("setting");

  const where: Record<string, unknown> = {
    OR: [
      { isStock: true },
      ...(session?.user?.id ? [{ userId: session.user.id }] : []),
    ],
  };
  if (gender) where.gender = gender;
  if (ageRange) where.ageRange = ageRange;
  if (vibe) where.vibe = vibe;
  if (setting) where.setting = setting;

  const actors = await prisma.actor.findMany({
    where,
    orderBy: [{ isStock: "desc" }, { usageCount: "desc" }, { name: "asc" }],
    take: 200,
  });

  return NextResponse.json({ actors });
}

const createSchema = z.object({
  name: z.string().min(1).max(60),
  imageUrl: z.string().url(),
  gender: z.enum(["female", "male", "non-binary"]).optional(),
  ageRange: z.enum(["young-adult", "adult", "mature", "senior"]).optional(),
  vibe: z.string().max(30).optional(),
  setting: z.string().max(30).optional(),
  language: z.string().max(10).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
  if (!user || !canUploadCustomActor(user.plan as PlanKey)) {
    return NextResponse.json({ error: "Custom actors require a Pro plan" }, { status: 402 });
  }

  const body = createSchema.parse(await req.json());

  const actor = await prisma.actor.create({
    data: {
      userId: session.user.id,
      name: body.name,
      imageUrl: body.imageUrl,
      thumbnailUrl: body.imageUrl,
      gender: body.gender,
      ageRange: body.ageRange,
      vibe: body.vibe,
      setting: body.setting,
      language: body.language ?? "en",
      isStock: false,
    },
  });

  return NextResponse.json({ actor });
}
