/**
 * POST /api/ads/[id]/finalize
 *
 * Per-scene approach (no server-side concat needed):
 *   For each READY scene:
 *     1. TTS the scene's spokenLine → voiceoverUrl
 *     2. Lip-sync the scene clip against that audio → finalClipUrl
 *     3. Persist finalClipUrl on the scene
 *   Mark ad.finalVideoStatus = "READY"
 *
 * GET: returns finalization status + allScenesReady flag.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lipSyncVideo, isReplicateConfigured } from "@/lib/replicate";
import { uploadToStorage } from "@/lib/storage";
import { checkCredits, deductCredits } from "@/lib/credits";
import { generateVoiceover } from "@/lib/tts";

export const maxDuration = 300;

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
      scenes: { select: { status: true, videoClipUrl: true, finalClipUrl: true } },
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
    include: {
      actor: true,
      scenes: { where: { status: "READY" }, orderBy: { sceneNumber: "asc" } },
    },
  });
  if (!ad || ad.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ad.scenes.length === 0) return NextResponse.json({ error: "No ready scenes" }, { status: 400 });
  if (ad.finalVideoStatus === "GENERATING") return NextResponse.json({ error: "Already running" }, { status: 409 });
  if (ad.finalVideoStatus === "READY") return NextResponse.json({ success: true, message: "Already finalized" });

  // Cost: 5 base + 2 per scene (TTS + lipsync per scene)
  const cost = 5 + ad.scenes.length * 2;
  if (!(await checkCredits(userId, cost))) {
    return NextResponse.json({ error: `Need ${cost} credits`, neededCredits: cost }, { status: 402 });
  }

  await deductCredits(userId, cost);
  await prisma.ad.update({ where: { id }, data: { finalVideoStatus: "GENERATING", finalVideoError: null } });

  // Map DB ageRange to simple age values for voice selection
  const ageRangeMap: Record<string, string> = {
    "young-adult": "young", "adult": "middle", "mature": "senior", "senior": "senior",
  };
  const mappedAge = ad.actor?.ageRange ? (ageRangeMap[ad.actor.ageRange] ?? "middle") : "middle";
  let voiceSettings: Record<string, unknown> | undefined;
  try { voiceSettings = ad.voiceSettings ? JSON.parse(ad.voiceSettings) : undefined; } catch { /* ignore */ }

  let lastFinalClipUrl: string | null = null;
  const errors: string[] = [];

  // Per-scene: TTS → lipsync (sequential, one at a time)
  for (const scene of ad.scenes) {
    const spokenText = scene.spokenLine?.trim() || ad.script || "";
    if (!spokenText || !scene.videoClipUrl) continue;

    try {
      // 1. Generate TTS for this scene's spoken line
      const tts = await generateVoiceover({
        text: spokenText,
        settings: voiceSettings as never,
        actor: ad.actor ? { gender: ad.actor.gender, age: mappedAge, vibe: ad.actor.vibe } : undefined,
        language: ad.language,
      });

      // 2. Lipsync this scene's clip with its voiceover
      let finalClipUrl: string;
      try {
        finalClipUrl = await lipSyncVideo({
          videoUrl: scene.videoClipUrl,
          audioUrl: tts.audioUrl,
          gender: ad.actor?.gender ?? null,
        });
      } catch {
        // Fallback: use text-based lipsync (Kling's built-in TTS)
        finalClipUrl = await lipSyncVideo({
          videoUrl: scene.videoClipUrl,
          text: spokenText.slice(0, 300),
          gender: ad.actor?.gender ?? null,
        });
      }

      // 3. Persist to permanent storage
      let permanentUrl = finalClipUrl;
      try {
        const buf = await fetch(finalClipUrl).then((r) => r.arrayBuffer());
        permanentUrl = await uploadToStorage({
          bytes: Buffer.from(buf),
          contentType: "video/mp4",
          extension: "mp4",
          folder: "ads/final",
        });
      } catch { /* use Replicate temp URL */ }

      await prisma.scene.update({
        where: { id: scene.id },
        data: { finalClipUrl: permanentUrl, voiceoverUrl: tts.audioUrl },
      });
      lastFinalClipUrl = permanentUrl;
    } catch (err) {
      const msg = (err as Error).message;
      errors.push(`Scene ${scene.sceneNumber}: ${msg}`);
      // Store original clip as fallback so user still gets something
      lastFinalClipUrl = lastFinalClipUrl ?? scene.videoClipUrl;
    }

    // 3s gap between scenes to stay inside Replicate burst limit
    if (ad.scenes.indexOf(scene) < ad.scenes.length - 1) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  const hasErrors = errors.length > 0;
  await prisma.ad.update({
    where: { id },
    data: {
      finalVideoStatus: hasErrors && !lastFinalClipUrl ? "FAILED" : "READY",
      finalVideoError: hasErrors ? errors.join("; ") : null,
      videoUrl: lastFinalClipUrl,
      status: "READY",
    },
  });

  return NextResponse.json({
    success: true,
    creditsCharged: cost,
    sceneCount: ad.scenes.length,
    errors: hasErrors ? errors : undefined,
    message: hasErrors
      ? `Finalized with ${errors.length} error(s) — some scenes may not be lip-synced`
      : "All scenes lip-synced. Watch each scene in Studio.",
  });
}
