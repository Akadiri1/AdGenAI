/**
 * PATCH /api/ads/[id]/scenes/[sceneId]
 *
 * Direct text edit of a scene (prompt, spokenLine, durationSeconds).
 * Allowed only when the scene status is PENDING (i.e. the ad is still a DRAFT).
 * Once a scene is GENERATING_VIDEO/READY, editing must go through /refine.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  prompt: z.string().min(3).max(2000).optional(),
  spokenLine: z.string().max(500).nullable().optional(),
  durationSeconds: z.union([z.literal(5), z.literal(10)]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; sceneId: string }> },
) {
  const { id, sceneId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid request", details: (err as Error).message }, { status: 400 });
  }

  const ad = await prisma.ad.findUnique({
    where: { id },
    select: { userId: true, scenes: { where: { id: sceneId } } },
  });
  if (!ad || ad.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const scene = ad.scenes[0];
  if (!scene) return NextResponse.json({ error: "Scene not found" }, { status: 404 });

  if (scene.status !== "PENDING") {
    return NextResponse.json({
      error: "Scene is already generating or done — use /refine to edit with an instruction",
    }, { status: 409 });
  }

  const updated = await prisma.scene.update({
    where: { id: sceneId },
    data: {
      ...(body.prompt !== undefined && { prompt: body.prompt }),
      ...(body.spokenLine !== undefined && { spokenLine: body.spokenLine }),
      ...(body.durationSeconds !== undefined && { durationSeconds: body.durationSeconds }),
    },
  });

  return NextResponse.json({
    success: true,
    scene: {
      id: updated.id,
      sceneNumber: updated.sceneNumber,
      status: updated.status,
      durationSeconds: updated.durationSeconds,
      prompt: updated.prompt,
      spokenLine: updated.spokenLine,
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; sceneId: string }> },
) {
  const { id, sceneId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ad = await prisma.ad.findUnique({
    where: { id },
    select: { userId: true, status: true, scenes: { where: { id: sceneId } } },
  });
  if (!ad || ad.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const scene = ad.scenes[0];
  if (!scene) return NextResponse.json({ error: "Scene not found" }, { status: 404 });

  if (scene.status !== "PENDING") {
    return NextResponse.json({ error: "Can only delete PENDING scenes (draft mode)" }, { status: 409 });
  }

  await prisma.scene.delete({ where: { id: sceneId } });
  return NextResponse.json({ success: true });
}
