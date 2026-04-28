/**
 * GET /api/ads/[id]/scenes
 * Returns all scenes for an ad, polling Kling for any that are still generating
 * and persisting the final video URL when ready.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getKlingClipStatus } from "@/lib/replicate";
import { uploadToStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ad = await prisma.ad.findUnique({ where: { id }, include: { scenes: { orderBy: { sceneNumber: "asc" } } } });
  if (!ad || ad.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // For any scene still generating, ping Kling
  const updated = await Promise.all(
    ad.scenes.map(async (s) => {
      if (s.status !== "GENERATING_VIDEO" || !s.klingTaskId) return s;
      try {
        const result = await getKlingClipStatus(s.klingTaskId);
        if (result.status === "succeeded" && result.videoUrl) {
          // Persist the video to our storage so it doesn't expire
          let permanentUrl = result.videoUrl;
          try {
            const buf = await fetch(result.videoUrl).then((r) => r.arrayBuffer());
            permanentUrl = await uploadToStorage({
              bytes: Buffer.from(buf),
              contentType: "video/mp4",
              extension: "mp4",
              folder: "ads/scenes",
            });
          } catch { /* fall back to temp URL if upload fails */ }

          return prisma.scene.update({
            where: { id: s.id },
            data: { status: "READY", videoClipUrl: permanentUrl },
          });
        }
        if (result.status === "failed" || result.status === "canceled") {
          return prisma.scene.update({
            where: { id: s.id },
            data: { status: "FAILED", editInstructions: result.error ?? "Kling generation failed" },
          });
        }
        return s;
      } catch {
        return s;
      }
    }),
  );

  // If all scenes ready, mark the ad as READY
  const allReady = updated.length > 0 && updated.every((s) => s.status === "READY");
  if (allReady && ad.status !== "READY") {
    await prisma.ad.update({ where: { id }, data: { status: "READY" } });
  }

  return NextResponse.json({
    adStatus: allReady ? "READY" : ad.status,
    scenes: updated.map((s) => ({
      id: s.id,
      sceneNumber: s.sceneNumber,
      status: s.status,
      durationSeconds: s.durationSeconds,
      prompt: s.prompt,
      spokenLine: s.spokenLine,
      compositeImageUrl: s.compositeImageUrl,
      videoClipUrl: s.videoClipUrl,
      finalClipUrl: s.finalClipUrl,
      editInstructions: s.editInstructions,
    })),
  });
}
