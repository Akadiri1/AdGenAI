/**
 * GET /api/ads/[id]/scenes
 * Polls both Kling video generation AND Kling Lip Sync predictions.
 * Scene lifecycle:
 *   PENDING → GENERATING_VIDEO (klingTaskId set) → READY (videoClipUrl set)
 *   Then finalize kicks off lipsync → lipSyncTaskId set → finalClipUrl set
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getKlingClipStatus } from "@/lib/replicate";
import { getPrediction } from "@/lib/replicate-internal";
import { uploadToStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ad = await prisma.ad.findUnique({
    where: { id },
    include: { scenes: { orderBy: { sceneNumber: "asc" } } },
  });
  if (!ad || ad.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await Promise.all(
    ad.scenes.map(async (s) => {

      // ── 1. Poll Kling video generation ──────────────────────────────────
      if (s.status === "GENERATING_VIDEO" && s.klingTaskId) {
        try {
          const result = await getKlingClipStatus(s.klingTaskId);
          if (result.status === "succeeded" && result.videoUrl) {
            let permanentUrl = result.videoUrl;
            try {
              const buf = await fetch(result.videoUrl).then((r) => r.arrayBuffer());
              permanentUrl = await uploadToStorage({
                bytes: Buffer.from(buf),
                contentType: "video/mp4",
                extension: "mp4",
                folder: "ads/scenes",
              });
            } catch { /* keep temp URL */ }
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
        } catch { /* keep polling */ }
        return s;
      }

      // ── 2. Poll Kling Lip Sync (finalClipUrl not set yet) ───────────────
      if (s.lipSyncTaskId && !s.finalClipUrl) {
        try {
          const p = await getPrediction(s.lipSyncTaskId);
          if (p.status === "succeeded") {
            const rawUrl = typeof p.output === "string" ? p.output
              : Array.isArray(p.output) ? p.output[0] : null;
            if (rawUrl) {
              let finalUrl = rawUrl as string;
              try {
                const buf = await fetch(finalUrl).then((r) => r.arrayBuffer());
                finalUrl = await uploadToStorage({
                  bytes: Buffer.from(buf),
                  contentType: "video/mp4",
                  extension: "mp4",
                  folder: "ads/final",
                });
              } catch { /* keep temp URL */ }
              return prisma.scene.update({
                where: { id: s.id },
                data: { finalClipUrl: finalUrl },
              });
            }
          }
          if (p.status === "failed" || p.status === "canceled") {
            // Lip-sync failed — clear the task ID so UI knows it's done (without a final clip)
            return prisma.scene.update({
              where: { id: s.id },
              data: { lipSyncTaskId: null },
            });
          }
        } catch { /* keep polling */ }
      }

      return s;
    }),
  );

  // Mark ad READY when all scene clips are done
  const allReady = updated.length > 0 && updated.every((s) => s.status === "READY");
  if (allReady && ad.status !== "READY") {
    await prisma.ad.update({ where: { id }, data: { status: "READY" } });
  }

  // Mark finalization READY when all finalClipUrls are set
  const allFinalized = allReady && updated.every((s) => s.finalClipUrl);
  if (allFinalized && ad.finalVideoStatus === "GENERATING") {
    const firstClip = updated[0]?.finalClipUrl;
    await prisma.ad.update({
      where: { id },
      data: { finalVideoStatus: "READY", videoUrl: firstClip ?? null },
    });
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
