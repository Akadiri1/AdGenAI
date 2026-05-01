/**
 * Client for the Famousli Veo Cloud Run service.
 * The service handles Google Cloud auth via service account — no keys in Next.js.
 *
 * Set VEO_SERVICE_URL in Vercel env vars once Cloud Run is deployed.
 * Format: https://veo-XXXX-uc.a.run.app
 */

export function isVeoConfigured(): boolean {
  return !!process.env.VEO_SERVICE_URL;
}

type VeoGenerateParams = {
  prompt: string;
  imageUrl?: string;      // optional: image-to-video (your actor composite)
  duration?: 5 | 10;
  aspectRatio?: "9:16" | "16:9" | "1:1";
};

type VeoResult = {
  status: "ready" | "failed";
  videoUrl: string | null;
  error?: string;
};

/**
 * Generate a video clip via Veo 2.
 * Blocks until the video is ready (up to 5 minutes).
 * Returns a Google Cloud Storage URI (gs://...) or signed URL.
 */
export async function generateVeoClip(params: VeoGenerateParams): Promise<string> {
  const baseUrl = process.env.VEO_SERVICE_URL?.replace(/\/$/, "");
  if (!baseUrl) throw new Error("VEO_SERVICE_URL not configured");

  const res = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: params.prompt,
      image_url: params.imageUrl ?? null,
      duration: params.duration ?? 5,
      aspect_ratio: params.aspectRatio ?? "9:16",
    }),
    signal: AbortSignal.timeout(330_000), // 5.5 min
  });

  const data = (await res.json()) as VeoResult;
  if (!res.ok || data.error) throw new Error(`Veo generation failed: ${data.error ?? res.status}`);
  if (!data.videoUrl) throw new Error("Veo returned no video URL");
  return data.videoUrl;
}
