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
import { getKlingClipStatus, mixBackgroundAudio, addAutoCaptions } from "@/lib/replicate";
import { getQwenVideoStatus } from "@/lib/qwen";
import { getPrediction, createPrediction } from "@/lib/replicate-internal";
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

      // ── 1. Poll video generation ────────────────────────────────────────
      if (s.status === "GENERATING_VIDEO" && s.klingTaskId) {
        try {
          let result;
          // Qwen task IDs are typically UUID-like (with hyphens)
          // Replicate (Kling) IDs are usually alphanumeric strings without hyphens
          const isQwenTask = s.klingTaskId.includes("-");

          try {
            if (isQwenTask) {
              result = await getQwenVideoStatus(s.klingTaskId);
            } else {
              result = await getKlingClipStatus(s.klingTaskId);
            }
          } catch (e) {
            console.warn(`[scenes] Status check failed for ${isQwenTask ? "Qwen" : "Kling"} task ${s.klingTaskId}:`, (e as Error).message);
            return s;
          }

          if (result.status === "succeeded" && result.videoUrl) {
            let permanentUrl = result.videoUrl;
            
            // ── IMPORTANT: Only permanentize if using EXTERNAL storage (R2).
            // If we are in local dev and R2 isn't set, uploadToStorage returns a 'localhost' URL.
            // Cloud workers (like Lip Sync or Stitching) CANNOT reach your localhost.
            // We must keep the provider's original public URL so they can fetch it.
            const { isStorageConfigured } = await import("@/lib/storage");
            if (isStorageConfigured()) {
              try {
                const buf = await fetch(result.videoUrl).then((r) => r.arrayBuffer());
                permanentUrl = await uploadToStorage({
                  bytes: Buffer.from(buf),
                  contentType: "video/mp4",
                  extension: "mp4",
                  folder: "ads/scenes",
                });
              } catch (e) { 
                console.warn("[scenes] Failed to upload to R2, keeping provider URL:", (e as Error).message);
              }
            } else {
              console.log("[scenes] Local dev detected. Keeping original public URL for cloud workers:", result.videoUrl);
            }

            return prisma.scene.update({
              where: { id: s.id },
              data: { status: "READY", videoClipUrl: permanentUrl },
            });
          }
          if (result.status === "failed" || result.status === "canceled") {
            let error = result.error ?? "Kling generation failed";
            
            // Helpful hint for local dev connectivity issues
            if (error.includes("failed to read the first frame") || error.includes("MoviePy") || error.includes("download") || error.includes("fetch")) {
              const actor = await prisma.actor.findFirst({ where: { ads: { some: { id: ad.id } } } });
              if (actor?.imageUrl?.includes("localhost")) {
                error = `Connectivity Error: External AI providers (Qwen/Replicate) cannot reach your localhost actor image. Use ngrok or configure R2 storage. (Original error: ${error})`;
              }
            }

            return prisma.scene.update({
              where: { id: s.id },
              data: { status: "FAILED", editInstructions: error },
            });
          }

          // ── Pass detailed status to UI
          return { ...s, statusMessage: result.status };
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

  // ── Mark ad READY when all scene clips are done (before lip-sync)
  const allReady = updated.length > 0 && updated.every((s) => s.status === "READY");
  if (allReady && ad.status !== "READY") {
    await prisma.ad.update({ where: { id }, data: { status: "READY" } });
  }

  // ── Finalization Phase: Trigger Stitching or Complete ──
  const allFinalized = allReady && updated.every((s) => s.finalClipUrl);
  if (allFinalized && ad.finalVideoStatus === "GENERATING") {
    if (updated.length === 1) {
      const firstClip = updated[0]?.finalClipUrl;
      // If we have music or captions, we can't just set to READY. We must kick off MIXING or CAPTIONING.
      if (ad.musicTrack) {
        try {
          const url = await mixBackgroundAudio(firstClip as string, ad.musicTrack);
          // Wait, mixBackgroundAudio creates a prediction.
          // Let's modify the flow to use createPrediction directly here.
        } catch (e) {}
      }
      
      // Simpler approach: If single clip, pretend it just finished STITCHING, so the polling below picks it up for the next step.
      await prisma.ad.update({
        where: { id },
        data: { finalVideoStatus: "STITCHING_DONE", videoUrl: firstClip ?? null },
      });
    } else {
      // Multiple scenes: kickoff concatenation
      try {
        const urls = updated.map(s => s.finalClipUrl as string);
        const { createPrediction } = await import("@/lib/replicate-internal");
        
        // Use lucataco/ffmpeg-concat model
        const prediction = await createPrediction("lucataco/ffmpeg-concat", undefined, { videos: urls });
        
        await prisma.ad.update({
          where: { id },
          data: { finalVideoStatus: "STITCHING", stitchTaskId: prediction.id },
        });
      } catch (err) {
        console.error("Concat start failed:", err);
        await prisma.ad.update({
          where: { id },
          data: { finalVideoStatus: "FAILED", finalVideoError: "Stitching failed" },
        });
      }
    }
  }

  // ── Poll Stitching / Audio / Caption Tasks ──
  let finalStatus = ad.finalVideoStatus;
  
  if (["STITCHING", "MIXING_AUDIO", "CAPTIONING"].includes(finalStatus ?? "") && ad.stitchTaskId) {
    try {
      const p = await getPrediction(ad.stitchTaskId);
      
      if (p.status === "succeeded") {
        let finalUrl = typeof p.output === "string" ? p.output : Array.isArray(p.output) ? p.output[0] : null;
        if (finalUrl) {
          // Transition to next state
          let nextState: "STITCHING_DONE" | "MIXING_AUDIO_DONE" | "CAPTIONING_DONE" | "READY" = "READY";
          
          if (finalStatus === "STITCHING") nextState = "STITCHING_DONE";
          if (finalStatus === "MIXING_AUDIO") nextState = "MIXING_AUDIO_DONE";
          if (finalStatus === "CAPTIONING") nextState = "CAPTIONING_DONE";

          await prisma.ad.update({
            where: { id },
            data: { finalVideoStatus: nextState, videoUrl: finalUrl, stitchTaskId: null },
          });
          finalStatus = nextState;
          ad.videoUrl = finalUrl;
        }
      } else if (p.status === "failed" || p.status === "canceled") {
        await prisma.ad.update({
          where: { id },
          data: { finalVideoStatus: "FAILED", finalVideoError: p.error ?? "Processing failed" },
        });
        finalStatus = "FAILED";
      }
    } catch { /* keep polling */ }
  }

  // ── State Machine Transitions ──
  // Re-fetch ad to get updated status
  const currentAd = await prisma.ad.findUnique({ where: { id } });
  if (currentAd) {
    let currentUrl = currentAd.videoUrl;
    
    // Stitching Done -> Start Audio Mixing
    if (currentAd.finalVideoStatus === "STITCHING_DONE") {
      if (currentAd.musicTrack && currentUrl) {
        try {
          const prediction = await createPrediction(
            "lucataco/ffmpeg",
            undefined,
            {
              video: currentUrl,
              audio: currentAd.musicTrack,
              command: `-i input_video -i input_audio -filter_complex "[1:a]volume=0.1[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k output.mp4`
            }
          );
          await prisma.ad.update({
            where: { id },
            data: { finalVideoStatus: "MIXING_AUDIO", stitchTaskId: prediction.id },
          });
          finalStatus = "MIXING_AUDIO";
        } catch (e) {
          // Fallback to next step if mixing fails
          await prisma.ad.update({ where: { id }, data: { finalVideoStatus: "MIXING_AUDIO_DONE" } });
        }
      } else {
        await prisma.ad.update({ where: { id }, data: { finalVideoStatus: "MIXING_AUDIO_DONE" } });
      }
    }

    const adAfterMixing = await prisma.ad.findUnique({ where: { id } });
    if (adAfterMixing?.finalVideoStatus === "MIXING_AUDIO_DONE") {
      currentUrl = adAfterMixing.videoUrl ?? currentUrl;
      const wantsCaptions = adAfterMixing.visualInstructions?.includes("[AUTOCAPTIONS]");
      
      if (wantsCaptions && currentUrl) {
        try {
          const prediction = await createPrediction(
            "fictionsai/autocaption",
            undefined,
            {
              video_file_input: currentUrl,
              font: "Montserrat",
              font_size: 45,
              font_color: "white",
              highlight_color: "#FF6B35",
              kerning: -1.5,
              stroke_color: "black",
              stroke_width: 3.5,
              align: "center",
              margin_bottom: 250,
            }
          );
          await prisma.ad.update({
            where: { id },
            data: { finalVideoStatus: "CAPTIONING", stitchTaskId: prediction.id },
          });
          finalStatus = "CAPTIONING";
        } catch (e) {
          await prisma.ad.update({ where: { id }, data: { finalVideoStatus: "CAPTIONING_DONE" } });
        }
      } else {
        await prisma.ad.update({ where: { id }, data: { finalVideoStatus: "CAPTIONING_DONE" } });
      }
    }

    const adAfterCaptioning = await prisma.ad.findUnique({ where: { id } });
    if (adAfterCaptioning?.finalVideoStatus === "CAPTIONING_DONE") {
      currentUrl = adAfterCaptioning.videoUrl ?? currentUrl;
      if (currentUrl) {
        // Upload final video to S3
        try {
          const buf = await fetch(currentUrl).then(r => r.arrayBuffer());
          currentUrl = await uploadToStorage({
            bytes: Buffer.from(buf),
            contentType: "video/mp4",
            extension: "mp4",
            folder: "ads/final",
          });
        } catch { /* keep temp url */ }
      }
      
      await prisma.ad.update({
        where: { id },
        data: { finalVideoStatus: "READY", videoUrl: currentUrl },
      });
      finalStatus = "READY";
    }
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
