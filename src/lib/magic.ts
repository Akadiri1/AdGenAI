/**
 * Magic API Integration.
 * Using their high-performance Video Generation capabilities.
 * Docs: https://magicapi.com/
 */

const MAGIC_BASE = "https://api.magicapi.com/v1";

async function magicRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.MAGIC_API_KEY;
  if (!key) throw new Error("MAGIC_API_KEY not configured");

  const res = await fetch(`${MAGIC_BASE}${path}`, {
    ...init,
    headers: {
      "x-magicapi-key": key,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Magic API error ${res.status}: ${JSON.stringify(data)}`);
  }

  return data as T;
}

export type MagicVideoParams = {
  prompt: string;
  model_id?: string; // e.g. hedra_avatar, minimax_hailuo_2_3_standard
  aspect_ratio?: "9:16" | "16:9" | "1:1";
  duration?: number;
};

/**
 * Start a video generation task on Magic API.
 */
export async function generateMagicVideo(params: MagicVideoParams): Promise<string> {
  const result = await magicRequest<{
    data: { task_id: string };
  }>("/video/generate", {
    method: "POST",
    body: JSON.stringify({
      model_id: params.model_id ?? "minimax_hailuo_2_3_standard",
      prompt: params.prompt,
      aspect_ratio: params.aspect_ratio ?? "9:16",
      duration: params.duration ?? 5,
    }),
  });

  return result.data.task_id;
}

/**
 * Check status of Magic task.
 */
export async function getMagicTaskStatus(taskId: string): Promise<{
  status: "completed" | "failed" | "processing";
  videoUrl?: string;
}> {
  const result = await magicRequest<{
    data: {
      status: string;
      video_url?: string;
    };
  }>(`/video/status/${taskId}`);

  return {
    status: result.data.status.toLowerCase() as "completed" | "failed" | "processing",
    videoUrl: result.data.video_url,
  };
}

export function isMagicConfigured(): boolean {
  return !!process.env.MAGIC_API_KEY;
}
