/**
 * Sadtalker via Replicate — talking head video generation.
 *
 * Cheaper alternative to HeyGen ($0.06/clip vs $24/mo).
 * Quality: 3.5/5 lip-sync, good enough for TikTok ad UGC.
 *
 * Pipeline:
 *   1. Take an actor image (URL)
 *   2. Generate TTS audio from script using a free TTS model
 *   3. Run Sadtalker with image + audio → returns talking head video
 */

import { uploadToStorage } from "@/lib/storage";

const REPLICATE_BASE = "https://api.replicate.com/v1";

// Pinned model versions (update periodically)
const SADTALKER_VERSION = "85c698db7c0a66d5011435d0191db323034e1da04b912a6d365833141b6a285b";
const TTS_VERSION = "684bc3855b37866c0c65add2ff39c78f3dea3f4ff103a436465326e0f438d55e"; // suno-ai/bark

export type SadtalkerVoice = {
  speed?: number; // 0.5 - 2.0
  presetVoice?: "default" | "male" | "female" | "energetic" | "calm";
};

export type SadtalkerResult = {
  predictionId: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  videoUrl?: string;
  error?: string;
};

async function replicateRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.REPLICATE_API_TOKEN;
  if (!key) throw new Error("REPLICATE_API_TOKEN not configured");

  const res = await fetch(`${REPLICATE_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

/**
 * Generate TTS audio from a script using Bark (free, multilingual).
 * Returns a URL to the generated audio file.
 */
export async function generateTTS(params: {
  text: string;
  voice?: SadtalkerVoice;
}): Promise<string> {
  // Bark's voice presets
  const voicePreset = params.voice?.presetVoice === "male"
    ? "v2/en_speaker_6"
    : params.voice?.presetVoice === "female"
      ? "v2/en_speaker_9"
      : params.voice?.presetVoice === "energetic"
        ? "v2/en_speaker_3"
        : "v2/en_speaker_9"; // default to friendly female

  const created = await replicateRequest<{
    id: string;
    status: string;
    output?: string;
    urls: { get: string };
  }>("/predictions", {
    method: "POST",
    body: JSON.stringify({
      version: TTS_VERSION,
      input: {
        prompt: params.text,
        history_prompt: voicePreset,
        text_temp: 0.7,
        waveform_temp: 0.7,
      },
    }),
  });

  // Poll until done (max 60s)
  const audioUrl = await pollPrediction(created.id, 60);
  if (!audioUrl) throw new Error("TTS generation failed");
  return audioUrl;
}

/**
 * Generate a talking-head video using Sadtalker.
 * @param sourceImageUrl URL of the actor's still photo
 * @param drivenAudioUrl URL of the audio that drives the lip-sync
 */
export async function generateSadtalkerVideo(params: {
  sourceImageUrl: string;
  drivenAudioUrl: string;
  still?: boolean;
  enhancer?: "gfpgan" | "RestoreFormer" | null;
  preprocess?: "crop" | "extcrop" | "resize" | "full" | "extfull";
}): Promise<SadtalkerResult> {
  const created = await replicateRequest<{
    id: string;
    status: string;
    urls: { get: string };
  }>("/predictions", {
    method: "POST",
    body: JSON.stringify({
      version: SADTALKER_VERSION,
      input: {
        source_image: params.sourceImageUrl,
        driven_audio: params.drivenAudioUrl,
        still: params.still ?? true,
        enhancer: params.enhancer ?? "gfpgan",
        preprocess: params.preprocess ?? "full",
      },
    }),
  });

  return {
    predictionId: created.id,
    status: "starting",
  };
}

/**
 * Poll a prediction until it completes or times out.
 * Returns the output URL on success, null on failure.
 */
export async function pollPrediction(
  predictionId: string,
  maxSeconds = 120,
): Promise<string | null> {
  const start = Date.now();
  while (Date.now() - start < maxSeconds * 1000) {
    const result = await replicateRequest<{
      status: string;
      output: string | string[] | null;
      error: string | null;
    }>(`/predictions/${predictionId}`);

    if (result.status === "succeeded" && result.output) {
      const out = Array.isArray(result.output) ? result.output[0] : result.output;
      return out as string;
    }
    if (result.status === "failed" || result.status === "canceled") {
      console.error("[sadtalker] prediction failed:", result.error);
      return null;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return null;
}

/**
 * Full pipeline: script → TTS audio → Sadtalker video → upload to storage.
 * Returns a stable URL to the final video on R2/local storage.
 */
export async function generateTalkingActor(params: {
  sourceImageUrl: string;
  script: string;
  voice?: SadtalkerVoice;
}): Promise<string> {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN not configured");
  }

  // 1. Generate audio from script
  const audioUrl = await generateTTS({
    text: params.script,
    voice: params.voice,
  });

  // 2. Generate talking head video
  const result = await generateSadtalkerVideo({
    sourceImageUrl: params.sourceImageUrl,
    drivenAudioUrl: audioUrl,
  });

  // 3. Poll for completion
  const videoUrl = await pollPrediction(result.predictionId, 180);
  if (!videoUrl) throw new Error("Sadtalker video generation failed");

  // 4. Rehost the video to our own storage
  try {
    const videoRes = await fetch(videoUrl);
    const buf = await videoRes.arrayBuffer();
    return await uploadToStorage({
      bytes: Buffer.from(buf),
      contentType: "video/mp4",
      extension: "mp4",
      folder: "ads/talking-actors",
    });
  } catch {
    // Fallback to Replicate URL if our storage upload fails
    return videoUrl;
  }
}

export function isReplicateConfigured(): boolean {
  return !!process.env.REPLICATE_API_TOKEN;
}
