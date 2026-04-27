/**
 * FFmpeg was removed during the ecommerce pivot (April 2026).
 * All video assembly now goes through Replicate:
 *   - Kling 2.6 Pro          → scene clips      (replicate.ts)
 *   - lucataco/ffmpeg-concat  → stitching        (replicate.ts)
 *   - Kling Lip Sync          → lip-sync         (replicate.ts)
 *   - ElevenLabs / Kokoro     → voiceover        (tts.ts)
 *
 * This file is intentionally a stub. Any calls here will throw at
 * runtime to surface regressions early.
 */

export type AspectRatio = "1:1" | "9:16" | "16:9" | "4:5";

export async function overlayActorOnBackground(_params: {
  actorVideoUrl: string;
  backgroundUrl: string;
  aspectRatio: AspectRatio;
}): Promise<string> {
  throw new Error(
    "overlayActorOnBackground is disabled — use Replicate (Kling + Nano Banana). See src/lib/replicate.ts",
  );
}

export async function generateVideoAd(_params: unknown): Promise<string> {
  throw new Error(
    "generateVideoAd is disabled — use POST /api/ads/[id]/start-generation instead.",
  );
}
