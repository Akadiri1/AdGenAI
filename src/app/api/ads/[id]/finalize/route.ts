/**
 * POST /api/ads/[id]/finalize
 *
 * Async lip-sync pipeline (same pattern as Kling scene generation):
 *   1. Generate TTS per scene (fast, ~2s each via ElevenLabs)
 *   2. Kick off Kling Lip Sync prediction per scene (async, returns predictionId)
 *   3. Store lipSyncTaskId on scene, return immediately — NO timeout
 *   4. The scenes polling endpoint checks lipSyncTaskId and writes finalClipUrl when done
 *
 * GET: returns finalization status + allScenesReady flag.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isReplicateConfigured, KLING_VOICES } from "@/lib/replicate";
import { uploadToStorage } from "@/lib/storage";
import { checkCredits, deductCredits } from "@/lib/credits";
import { generateVoiceover } from "@/lib/tts";

export const maxDuration = 60; // Just for kicking off predictions — plenty of time

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ad = await prisma.ad.findUnique({
    where: { id },
    select: {
      userId: true,
      videoUrl: true,
      finalVideoStatus: true,
      finalVideoError: true,
      scenes: {
        select: { status: true, videoClipUrl: true, finalClipUrl: true, lipSyncTaskId: true },
        orderBy: { sceneNumber: "asc" },
      },
    },
  });
  if (!ad || ad.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sceneCount = ad.scenes.length;
  const allScenesReady = sceneCount > 0 && ad.scenes.every((s: { status: string; videoClipUrl: string | null }) => s.status === "READY" && s.videoClipUrl);

  return NextResponse.json({
    videoUrl: ad.videoUrl,
    finalVideoStatus: ad.finalVideoStatus,
    finalVideoError: ad.finalVideoError,
    allScenesReady,
    sceneCount,
  });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  if (!isReplicateConfigured()) {
    return NextResponse.json({ error: "Replicate not configured" }, { status: 503 });
  }

  const ad = await prisma.ad.findUnique({
    where: { id },
    include: {
      actor: true,
      // Only process scenes that don't have a finalClipUrl yet
      scenes: {
        where: { status: "READY", finalClipUrl: null },
        orderBy: { sceneNumber: "asc" },
      },
    },
  });
  if (!ad || ad.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ad.scenes.length === 0) {
    // All scenes already have finalClipUrl — mark complete
    await prisma.ad.update({ where: { id }, data: { finalVideoStatus: "READY" } });
    return NextResponse.json({ success: true, message: "Already finalized" });
  }
  if (ad.finalVideoStatus === "GENERATING") return NextResponse.json({ error: "Already running" }, { status: 409 });

  // Cost only for scenes that still need processing
  const cost = 2 + ad.scenes.length * 2;
  if (!(await checkCredits(userId, cost))) {
    return NextResponse.json({ error: `Need ${cost} credits`, neededCredits: cost }, { status: 402 });
  }

  await deductCredits(userId, cost);
  await prisma.ad.update({ where: { id }, data: { finalVideoStatus: "GENERATING", finalVideoError: null } });

  // Voice selection
  const ageRangeMap: Record<string, string> = {
    "young-adult": "young", "adult": "middle", "mature": "senior", "senior": "senior",
  };
  const mappedAge = ad.actor?.ageRange ? (ageRangeMap[ad.actor.ageRange] ?? "middle") : "middle";
  let voiceSettings: Record<string, unknown> | undefined;
  try { voiceSettings = ad.voiceSettings ? JSON.parse(ad.voiceSettings) : undefined; } catch { /* ignore */ }

  const gender = ad.actor?.gender ?? "female";
  const klingVoiceId = gender === "male" ? KLING_VOICES.male : KLING_VOICES.female;

  // For each scene: TTS (fast) + kick off Kling Lip Sync (async, non-blocking)
  for (const scene of ad.scenes) {
    const spokenText = (scene.spokenLine?.trim() || "").slice(0, 300);
    if (!spokenText || !scene.videoClipUrl) continue;

    try {
      // 1. TTS — fast (~2s)
      let audioUrl: string | null = null;
      try {
        const tts = await generateVoiceover({
          text: spokenText,
          settings: voiceSettings as never,
          actor: { gender: ad.actor?.gender, age: mappedAge, vibe: ad.actor?.vibe },
          language: ad.language,
        });
        audioUrl = tts.audioUrl;
        await prisma.scene.update({ where: { id: scene.id }, data: { voiceoverUrl: audioUrl } });
      } catch (ttsErr) {
        console.warn("[finalize] TTS failed, will use text lipsync:", (ttsErr as Error).message);
      }

      // 2. Kick off Kling Lip Sync prediction (returns immediately with a prediction ID)
      const { createPrediction } = await import("@/lib/replicate-internal");
      const input: Record<string, unknown> = { video_url: scene.videoClipUrl };
      if (audioUrl) {
        input.audio_file = audioUrl;
      } else {
        input.text = spokenText;
        input.voice_id = klingVoiceId;
      }
      const prediction = await createPrediction("kwaivgi/kling-lip-sync", undefined, input);
      await prisma.scene.update({ where: { id: scene.id }, data: { lipSyncTaskId: prediction.id } });

    } catch (err) {
      console.error(`[finalize] Scene ${scene.sceneNumber} failed:`, (err as Error).message);
    }

    // Small gap between predictions
    await new Promise((r) => setTimeout(r, 2000));
  }

  return NextResponse.json({
    success: true,
    creditsCharged: cost,
    sceneCount: ad.scenes.length,
    message: "Lip-sync started for all scenes. Check back in 2-3 minutes.",
  });
}
