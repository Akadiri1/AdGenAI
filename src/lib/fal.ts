/**
 * Fal.ai Integration.
 * Using high-speed AI video models.
 * Docs: https://fal.ai/models/fal-ai/hunyuan-video
 */

const FAL_BASE = "https://queue.fal.run";

async function falRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("FAL_KEY not configured");

  const res = await fetch(`${FAL_BASE}${path}`, {
    ...init,
    headers: {
      "Authorization": `Key ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Fal.ai API error ${res.status}: ${JSON.stringify(data)}`);
  }

  return data as T;
}

export type FalVideoParams = {
  prompt: string;
  aspect_ratio?: "9:16" | "16:9" | "1:1";
};

/**
 * Start a video generation task on Fal.ai.
 */
export async function generateFalVideo(params: FalVideoParams): Promise<string> {
  // Using fal-ai/hunyuan-video for extreme speed and quality
  const result = await falRequest<{
    request_id: string;
  }>("/fal-ai/hunyuan-video", {
    method: "POST",
    body: JSON.stringify({
      prompt: params.prompt,
      aspect_ratio: params.aspect_ratio ?? "9:16",
    }),
  });

  return result.request_id;
}

/**
 * Check status of Fal.ai task.
 */
export async function getFalTaskStatus(requestId: string): Promise<{
  status: "completed" | "failed" | "processing";
  videoUrl?: string;
}> {
  const result = await falRequest<{
    status: string;
    video?: { url: string };
    logs?: any[];
  }>(`/fal-ai/hunyuan-video/requests/${requestId}`);

  const status = result.status.toLowerCase();

  return {
    status: status === "completed" ? "completed" : status === "failed" ? "failed" : "processing",
    videoUrl: result.video?.url,
  };
}

export function isFalConfigured(): boolean {
  return !!process.env.FAL_KEY;
}
