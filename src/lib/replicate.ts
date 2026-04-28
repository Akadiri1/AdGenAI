/**
 * Replicate API client.
 * One key, three models we care about:
 *   - Kling 2.6 Pro (image-to-video, 5-10s clips)
 *   - Nano Banana / Gemini 2.5 Flash Image (composite actor + product)
 *   - Kling Lip Sync (sync mouth to audio)
 *
 * Replicate uses an async pattern: create prediction → poll status → fetch URL.
 */

const REPLICATE_API = "https://api.replicate.com/v1";

export function isReplicateConfigured(): boolean {
  return !!process.env.REPLICATE_API_TOKEN;
}

type PredictionStatus = "starting" | "processing" | "succeeded" | "failed" | "canceled";

type Prediction = {
  id: string;
  status: PredictionStatus;
  output: unknown;
  error: string | null;
  urls: { get: string; cancel: string };
};

async function callReplicate(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${REPLICATE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  return res;
}

async function createPrediction(model: string, version: string | undefined, input: Record<string, unknown>): Promise<Prediction> {
  const body = version
    ? { version, input }
    : { input };
  const path = version ? "/predictions" : `/models/${model}/predictions`;
  const res = await callReplicate(path, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Replicate create failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as Prediction;
}

async function getPrediction(id: string): Promise<Prediction> {
  const res = await callReplicate(`/predictions/${id}`);
  if (!res.ok) throw new Error(`Replicate get failed: ${res.status}`);
  return (await res.json()) as Prediction;
}

/**
 * Poll a prediction until it's done. Returns the final output URL(s).
 * Throws if the prediction fails or exceeds maxWaitMs.
 */
export async function waitForPrediction(id: string, maxWaitMs = 300_000): Promise<unknown> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const p = await getPrediction(id);
    if (p.status === "succeeded") return p.output;
    if (p.status === "failed" || p.status === "canceled") {
      throw new Error(`Prediction ${p.status}: ${p.error ?? "unknown error"}`);
    }
    await new Promise((r) => setTimeout(r, 4000));
  }
  throw new Error("Prediction timed out");
}

// =====================================================================
// Nano Banana — composite actor + product into a single image
// =====================================================================
export async function compositeActorWithProduct(params: {
  actorImageUrl: string;
  productImageUrls: string[];
  prompt: string;
}): Promise<string> {
  if (!isReplicateConfigured()) throw new Error("REPLICATE_API_TOKEN not set");

  // google/nano-banana takes an array of input images and a prompt.
  const prediction = await createPrediction(
    "google/nano-banana",
    undefined,
    {
      prompt: params.prompt,
      image_input: [params.actorImageUrl, ...params.productImageUrls.slice(0, 3)],
      output_format: "png",
    },
  );

  const output = await waitForPrediction(prediction.id, 120_000);
  // Output is either a string URL or an array
  if (typeof output === "string") return output;
  if (Array.isArray(output) && typeof output[0] === "string") return output[0];
  throw new Error("Unexpected nano-banana output shape");
}

// =====================================================================
// Kling 2.6 Pro — image-to-video (5s or 10s clips)
// =====================================================================
export async function generateKlingVideoClip(params: {
  imageUrl: string;
  prompt: string;
  durationSeconds?: 5 | 10;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  negativePrompt?: string;
}): Promise<{ predictionId: string }> {
  if (!isReplicateConfigured()) throw new Error("REPLICATE_API_TOKEN not set");

  const prediction = await createPrediction(
    "kwaivgi/kling-v2.1",
    undefined,
    {
      prompt: params.prompt,
      start_image: params.imageUrl,
      duration: params.durationSeconds ?? 5,
      aspect_ratio: params.aspectRatio ?? "9:16",
      negative_prompt: params.negativePrompt ?? "blurry, low quality, distorted, watermark",
      mode: "pro",
    },
  );

  return { predictionId: prediction.id };
}

export async function getKlingClipStatus(predictionId: string): Promise<{
  status: PredictionStatus;
  videoUrl?: string;
  error?: string;
}> {
  const p = await getPrediction(predictionId);
  if (p.status === "succeeded") {
    const url = typeof p.output === "string" ? p.output : Array.isArray(p.output) ? p.output[0] : null;
    if (typeof url !== "string") return { status: "failed", error: "No video URL in output" };
    return { status: "succeeded", videoUrl: url };
  }
  return { status: p.status, error: p.error ?? undefined };
}

// =====================================================================
// Kling Lip Sync — sync an existing video to spoken audio
// =====================================================================
export async function lipSyncVideo(params: {
  videoUrl: string;
  audioUrl: string;
}): Promise<string> {
  if (!isReplicateConfigured()) throw new Error("REPLICATE_API_TOKEN not set");
  const prediction = await createPrediction(
    "kwaivgi/kling-lip-sync",
    undefined,
    {
      video_url: params.videoUrl,
      audio_url: params.audioUrl,
    },
  );
  const output = await waitForPrediction(prediction.id, 200_000);
  const url = typeof output === "string" ? output : Array.isArray(output) ? output[0] : null;
  if (typeof url !== "string") throw new Error("Lip-sync produced no URL");
  return url;
}

// =====================================================================
// TTS — Kokoro 82M (multi-voice, fast, ~$0.0005 per call)
// =====================================================================
export async function generateVoiceover(params: {
  text: string;
  voice?: "af_bella" | "af_heart" | "af_sarah" | "af_alloy" | "am_adam" | "am_michael" | "am_echo" | "bf_emma" | "bm_george";
  speed?: number;
}): Promise<string> {
  if (!isReplicateConfigured()) throw new Error("REPLICATE_API_TOKEN not set");

  const prediction = await createPrediction(
    "jaaari/kokoro-82m",
    undefined,
    {
      text: params.text,
      voice: params.voice ?? "af_bella",
      speed: params.speed ?? 1.0,
    },
  );
  const output = await waitForPrediction(prediction.id, 120_000);
  const url = typeof output === "string" ? output : Array.isArray(output) ? output[0] : null;
  if (typeof url !== "string") throw new Error("TTS produced no URL");
  return url;
}

/** Pick a Kokoro voice ID that roughly matches the actor's gender. */
export function pickVoiceForActor(gender: string | null | undefined): "af_bella" | "am_michael" {
  return gender === "male" ? "am_michael" : "af_bella";
}

// =====================================================================
// Video concat — stitches N clips into one MP4
// Uses lucataco/ffmpeg-concat which accepts an array of video URLs.
// =====================================================================
export async function concatVideos(params: {
  videoUrls: string[];
  audioUrl?: string; // optional voiceover layered on top of the concat
}): Promise<string> {
  if (!isReplicateConfigured()) throw new Error("REPLICATE_API_TOKEN not set");
  if (params.videoUrls.length === 0) throw new Error("No videos to concat");
  if (params.videoUrls.length === 1 && !params.audioUrl) {
    // Trivial — just return the single clip
    return params.videoUrls[0];
  }

  const prediction = await createPrediction(
    "lucataco/ffmpeg-concat",
    undefined,
    {
      videos: params.videoUrls,
      ...(params.audioUrl && { audio: params.audioUrl }),
    },
  );
  const output = await waitForPrediction(prediction.id, 300_000);
  const url = typeof output === "string" ? output : Array.isArray(output) ? output[0] : null;
  if (typeof url !== "string") throw new Error("Concat produced no URL");
  return url;
}
