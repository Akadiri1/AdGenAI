import { SignJWT } from "jose";

/**
 * Kling AI Video Generation Integration.
 * Docs: https://klingai.com/ (API Section)
 */

const KLING_BASE = "https://api.klingai.com/v1";

/**
 * Generate a JWT for Kling AI authentication using 'jose'.
 */
async function generateKlingToken(): Promise<string> {
  const accessKey = process.env.KLING_ACCESS_KEY;
  const secretKey = process.env.KLING_SECRET_KEY;

  if (!accessKey || !secretKey) {
    throw new Error("Kling AI credentials not configured");
  }

  const secret = new TextEncoder().encode(secretKey);

  return await new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(accessKey)
    .setIssuedAt()
    .setExpirationTime("30m")
    .setNotBefore("-5s")
    .sign(secret);
}

async function klingRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await generateKlingToken();

  const res = await fetch(`${KLING_BASE}${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Kling API error ${res.status}: ${JSON.stringify(data)}`);
  }

  return data as T;
}

export type KlingVideoParams = {
  prompt: string;
  negative_prompt?: string;
  aspect_ratio?: "16:9" | "9:16" | "1:1";
  duration?: "5" | "10";
};

/**
 * Start a video generation task.
 */
export async function generateKlingVideo(params: KlingVideoParams): Promise<string> {
  const result = await klingRequest<{
    data: { task_id: string };
  }>("/videos/text2video", {
    method: "POST",
    body: JSON.stringify({
      prompt: params.prompt,
      negative_prompt: params.negative_prompt,
      cfg_scale: 0.5,
      mode: "std",
      aspect_ratio: params.aspect_ratio ?? "9:16",
      duration: params.duration ?? "5",
    }),
  });

  return result.data.task_id;
}

/**
 * Check the status of a Kling video task.
 */
export async function getKlingTaskStatus(taskId: string): Promise<{
  status: "succeeded" | "failed" | "processing" | "queued";
  videoUrl?: string;
}> {
  const result = await klingRequest<{
    data: {
      task_status: string;
      task_status_msg: string;
      video_status?: {
        video_url: string;
      };
    };
  }>(`/videos/text2video/${taskId}`);

  const status = result.data.task_status;
  
  if (status === "SUCCEEDED") {
    return { status: "succeeded", videoUrl: result.data.video_status?.video_url };
  } else if (status === "FAILED") {
    return { status: "failed" };
  } else {
    return { status: "processing" };
  }
}

export function isKlingConfigured(): boolean {
  return !!process.env.KLING_ACCESS_KEY && !!process.env.KLING_SECRET_KEY;
}
