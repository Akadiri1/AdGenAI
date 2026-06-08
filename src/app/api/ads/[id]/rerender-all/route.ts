/**
 * POST /api/ads/[id]/rerender-all
 *
 * Resets all scenes in an ad back to PENDING and sets ad status to DRAFT.
 * This allows the user to hit "Confirm & Start" again to re-generate the entire ad.
 * Can optionally take a single instruction to apply to all scenes (via refine-all logic).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ad = await prisma.ad.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!ad || ad.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Reset ad and all its scenes
    await prisma.$transaction([
      prisma.ad.update({
        where: { id },
        data: {
          status: "DRAFT",
          finalVideoStatus: null,
          finalVideoError: null,
          videoUrl: null,
        },
      }),
      prisma.scene.updateMany({
        where: { adId: id },
        data: {
          status: "PENDING",
          videoClipUrl: null,
          finalClipUrl: null,
          lipSyncTaskId: null,
          klingTaskId: null,
          editInstructions: null,
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Ad reset to draft. You can now re-render all scenes." });
  } catch (err) {
    return NextResponse.json({ error: "Failed to reset ad", details: (err as Error).message }, { status: 500 });
  }
}
