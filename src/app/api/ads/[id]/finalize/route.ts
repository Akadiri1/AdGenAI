/**
 * POST /api/ads/[id]/finalize
 *
 * Stitches all READY scenes into one final ad MP4:
 *   1. Generate one voiceover from the full spoken script (TTS)
 *   2. Concatenate all scene clips into a silent video
 *   3. Lip-sync the concat against the voiceover → final MP4
 *   4. Upload to R2, save to ad.videoUrl, mark ad final-ready
 *
 * Cost: ~5 credits + 2 per scene (TTS + concat are cheap; lipsync is the chunky one).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  concatVideos,
  lipSyncVideo,
  isReplicateConfigured,
} from "@/lib/replicate";
import { generateVoiceover } from "@/lib/tts";
import { uploadToStorage } from "@/lib/storage";
import { checkCredits, deductCredits } from "@/lib/credits";

export const maxDuration = 300; // Vercel Hobby cap; lipsync usually finishes in ~120s

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
      scenes: { select: { status: true, videoClipUrl: true } },
    },
  });
  if (!ad || ad.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sceneCount = ad.scenes.length;
  const allScenesReady = sceneCount > 0 && ad.scenes.every((s) => s.status === "READY" && s.videoClipUrl);

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
    include: { actor: true, scenes: { orderBy: { sceneNumber: "asc" } } },
  });
  if (!ad || ad.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Validate state
  if (ad.scenes.length === 0) return NextResponse.json({ error: "No scenes" }, { status: 400 });
  const allReady = ad.scenes.every((s) => s.status === "READY" && s.videoClipUrl);
  if (!allReady) {
    return NextResponse.json({
      error: "Not all scenes are READY yet — wait for generation to finish before finalizing",
    }, { status: 409 });
  }
  if (ad.finalVideoStatus === "GENERATING") {
    return NextResponse.json({ error: "Finalization already running" }, { status: 409 });
  }
  if (ad.videoUrl && ad.finalVideoStatus === "READY") {
    return NextResponse.json({ success: true, videoUrl: ad.videoUrl, message: "Already final" });
  }

  const cost = 5 + ad.scenes.length * 2;
  if (!(await checkCredits(userId, cost))) {
    return NextResponse.json({ error: `Need ${cost} credits to finalize`, neededCredits: cost }, { status: 402 });
  }

  await deductCredits(userId, cost);
  await prisma.ad.update({ where: { id }, data: { finalVideoStatus: "GENERATING", finalVideoError: null } });

  try {
    // Build the spoken text from each scene's spokenLine, fallback to ad.script
    const scriptText = ad.scenes
      .map((s) => s.spokenLine?.trim())
      .filter(Boolean)
      .join(" ");
    const text = scriptText || ad.script || "";
    if (!text.trim()) throw new Error("No spoken text found across scenes or ad.script");

    // 1. Voiceover (one TTS call — much cheaper than per-scene)
    let voiceSettings: Record<string, unknown> | undefined;
    try { voiceSettings = ad.voiceSettings ? JSON.parse(ad.voiceSettings) : undefined; } catch { /* ignore */ }

    // Map DB ageRange ("young-adult" | "adult" | "mature" | "senior") to
    // the simple values pickElevenLabsVoice expects ("young" | "middle" | "senior")
    const ageRangeMap: Record<string, string> = {
      "young-adult": "young",
      "adult":       "middle",
      "mature":      "senior",
      "senior":      "senior",
    };
    const mappedAge = ad.actor?.ageRange
      ? (ageRangeMap[ad.actor.ageRange] ?? "middle")
      : "middle";

    const tts = await generateVoiceover({
      text,
      settings: voiceSettings as never,
      actor: ad.actor ? {
        gender: ad.actor.gender,
        age: mappedAge,
        vibe: ad.actor.vibe,
      } : undefined,
      language: ad.language,
    });
    const voiceoverUrl = tts.audioUrl;

    // 2. Concat all scene clips into one silent video
    const clipUrls = ad.scenes.map((s) => s.videoClipUrl as string);
    const concatUrl = await concatVideos({ videoUrls: clipUrls });

    // 3. Lip-sync — try audio_file first, fall back to text if audio URL is unreachable
    let lipsyncedUrl: string;
    try {
      lipsyncedUrl = await lipSyncVideo({ videoUrl: concatUrl, audioUrl: voiceoverUrl });
    } catch (lipErr) {
      const msg = (lipErr as Error).message;
      // If audio_file fails (unreachable URL), drive lip-sync from the text directly
      if (msg.includes("audio") || msg.includes("invalid") || msg.includes("E006")) {
        console.warn("[finalize] audio_file failed, falling back to text lip-sync:", msg);
        lipsyncedUrl = await lipSyncVideo({ videoUrl: concatUrl, text });
      } else {
        throw lipErr;
      }
    }

    // 4. Persist to R2 (or local fallback) so the URL doesn't expire
    let permanentUrl = lipsyncedUrl;
    try {
      const buf = await fetch(lipsyncedUrl).then((r) => r.arrayBuffer());
      permanentUrl = await uploadToStorage({
        bytes: Buffer.from(buf),
        contentType: "video/mp4",
        extension: "mp4",
        folder: "ads/final",
      });
    } catch { /* fall back to the temp Replicate URL */ }

    await prisma.ad.update({
      where: { id },
      data: {
        videoUrl: permanentUrl,
        voiceoverUrl,
        finalVideoStatus: "READY",
        finalVideoError: null,
        status: "READY",
      },
    });

    return NextResponse.json({
      success: true,
      videoUrl: permanentUrl,
      creditsCharged: cost,
    });
  } catch (err) {
    const msg = (err as Error).message;
    await prisma.ad.update({
      where: { id },
      data: { finalVideoStatus: "FAILED", finalVideoError: msg },
    });
    return NextResponse.json({ error: "Finalization failed", details: msg }, { status: 500 });
  }
}
