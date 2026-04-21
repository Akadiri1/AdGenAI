/**
 * SiliconFlow AI Integration.
 * Using high-speed models like HunyuanVideo.
 * Docs: https://siliconflow.cn/en/
 */

const SILICONFLOW_BASE = "https://api.siliconflow.cn/v1";

async function siliconRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.SILICONFLOW_API_KEY;
  if (!key) throw new Error("SILICONFLOW_API_KEY not configured");

  const res = await fetch(`${SILICONFLOW_BASE}${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`SiliconFlow API error ${res.status}: ${JSON.stringify(data)}`);
  }

  return data as T;
}

export type SiliconVideoParams = {
  prompt: string;
  aspect_ratio?: "9:16" | "16:9" | "1:1";
};

/**
 * Start a video generation task on SiliconFlow.
 */
export async function generateSiliconVideo(params: SiliconVideoParams): Promise<string> {
  // Using HunyuanVideo as it's the premium standard on SiliconFlow
  const result = await siliconRequest<{
    data: { task_id: string };
  }>("/video/text-to-video", {
    method: "POST",
    body: JSON.stringify({
      model: "hunyuan-video",
      prompt: params.prompt,
      aspect_ratio: params.aspect_ratio ?? "9:16",
    }),
  });

  return result.data.task_id;
}

/**
 * Check status of SiliconFlow task.
 */
export async function getSiliconTaskStatus(taskId: string): Promise<{
  status: "completed" | "failed" | "processing";
  videoUrl?: string;
}> {
  const result = await siliconRequest<{
    data: {
      status: string;
      video_url?: string;
    };
  }>(`/video/status/${taskId}`);

  const status = result.data.status.toLowerCase();

  return {
    status: status === "succeeded" ? "completed" : status === "failed" ? "failed" : "processing",
    videoUrl: result.data.video_url,
  };
}

export function isSiliconFlowConfigured(): boolean {
  return !!process.env.SILICONFLOW_API_KEY;
}
