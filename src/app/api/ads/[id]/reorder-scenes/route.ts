/**
 * PATCH /api/ads/[id]/reorder-scenes
 * Body: { order: string[] } — array of scene IDs in the new order
 * Updates sceneNumber on each scene to match the new order.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  order: z.array(z.string()).min(1),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { order } = bodySchema.parse(await req.json());

  const ad = await prisma.ad.findUnique({ where: { id }, select: { userId: true } });
  if (!ad || ad.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Update each scene's sceneNumber to match the new order
  await Promise.all(
    order.map((sceneId, idx) =>
      prisma.scene.update({
        where: { id: sceneId },
        data: { sceneNumber: idx + 1 },
      })
    )
  );

  return NextResponse.json({ success: true });
}
