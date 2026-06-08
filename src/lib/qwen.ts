import { logApiHealth } from "./apiHealth";

const DASHSCOPE_INTL_BASE = "https://dashscope-intl.aliyuncs.com/api/v1";
const OPENAI_COMPATIBLE_BASE = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";

/**
 * Qwen (DashScope International) Integration.
 * Supports:
 *  - Text Generation (OpenAI-compatible)
 *  - Video Generation (WanX 2.1)
 *  - Text-to-Speech (Qwen3-TTS)
 */

// ── TEXT GENERATION ────────────────────────────────────────────────────────

export async function generateQwenText(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
  model?: string;
}): Promise<string> {
  const key = process.env.QWEN_API_KEY;
  if (!key) throw new Error("QWEN_API_KEY not set");

  const model = params.model ?? process.env.QWEN_MODEL ?? "qwen-max";

  const res = await fetch(`${OPENAI_COMPATIBLE_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: params.system },
        { role: "user",   content: params.prompt },
      ],
      max_tokens: params.maxTokens ?? 4096,
      temperature: 0.9,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    await logApiHealth("qwen", false, `Text Error ${res.status}: ${error}`);
    throw new Error(`Qwen Text API error ${res.status}: ${error}`);
  }
  
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    await logApiHealth("qwen", false, "No text in response");
    throw new Error("No text in Qwen response");
  }

  const tokens = data.usage?.total_tokens || 0;
  await logApiHealth("qwen", true, undefined, tokens);
  return text.trim();
}

// ── VIDEO GENERATION (WANX) ────────────────────────────────────────────────

export async function generateQwenVideo(params: {
  prompt: string;
  imageUrl?: string;
  duration?: 5 | 10;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  model?: string;
}): Promise<{ taskId: string }> {
  const key = process.env.QWEN_API_KEY;
  if (!key) throw new Error("QWEN_API_KEY not set");

  const model = params.model ?? (params.imageUrl ? "wan2.1-i2v-plus" : "wan2.1-t2v-plus");
  const resolutionMap = {
    "9:16": "720*1280",
    "16:9": "1280*720",
    "1:1": "960*960"
  };

  const res = await fetch(`${DASHSCOPE_INTL_BASE}/services/aigc/video-generation/video-synthesis`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable"
    },
    body: JSON.stringify({
      model,
      input: {
        prompt: params.prompt,
        ...(params.imageUrl && { img_url: params.imageUrl })
      },
      parameters: {
        resolution: resolutionMap[params.aspectRatio ?? "9:16"],
        duration: params.duration ?? 5,
        prompt_extend: true
      }
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    await logApiHealth("qwen", false, `Video Error ${res.status}: ${error}`);
    throw new Error(`Qwen Video API error ${res.status}: ${error}`);
  }

  const data = await res.json();
  const taskId = data.output?.task_id;
  if (!taskId) throw new Error("No task_id in Qwen video response");

  await logApiHealth("qwen", true);
  return { taskId };
}

export async function getQwenVideoStatus(taskId: string): Promise<{
  status: "succeeded" | "failed" | "processing" | "queued";
  videoUrl?: string;
  error?: string;
}> {
  const key = process.env.QWEN_API_KEY;
  if (!key) throw new Error("QWEN_API_KEY not set");

  const res = await fetch(`${DASHSCOPE_INTL_BASE}/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${key}` }
  });

  if (!res.ok) throw new Error(`Qwen task check failed: ${res.status}`);
  const data = await res.json();
  const status = data.output?.task_status;

  if (status === "SUCCEEDED") {
    let videoUrl = data.output?.video_url;
    if (videoUrl && videoUrl.startsWith("http://")) {
      videoUrl = videoUrl.replace("http://", "https://");
    }
    return { status: "succeeded", videoUrl };
  } else if (status === "FAILED") {
    return { status: "failed", error: data.output?.message };
  } else {
    // Return lowercase status for more granular UI feedback (e.g. queued, pending)
    return { status: (status?.toLowerCase() || "processing") as any };
  }
}

// ── SPEECH GENERATION (TTS) ───────────────────────────────────────────────

export async function generateQwenSpeech(params: {
  text: string;
  voice?: string;
  speed?: number;
}): Promise<string> {
  const key = process.env.QWEN_API_KEY;
  if (!key) throw new Error("QWEN_API_KEY not set");

  // DashScope TTS v2 (CosyVoice based)
  const res = await fetch(`${DASHSCOPE_INTL_BASE}/services/aigc/multimodal-generation/generation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen3-tts-flash",
      input: { text: params.text },
      parameters: {
        voice: params.voice ?? "Cherry",
        format: "mp3",
        speech_rate: params.speed ?? 1.0,
      }
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    await logApiHealth("qwen", false, `Speech Error ${res.status}: ${error}`);
    throw new Error(`Qwen Speech API error ${res.status}: ${error}`);
  }

  const data = await res.json();
  // Qwen TTS response: output.audio.url
  let audioUrl = data.output?.audio?.url;
  if (!audioUrl) {
    console.error("[Qwen TTS] Response missing URL:", JSON.stringify(data));
    throw new Error("No audio_url in Qwen speech response");
  }

  // Upgrade to HTTPS for cloud worker compatibility
  if (audioUrl.startsWith("http://")) {
    audioUrl = audioUrl.replace("http://", "https://");
  }

  await logApiHealth("qwen", true);
  return audioUrl;
}

export function isQwenConfigured(): boolean {
  return !!process.env.QWEN_API_KEY;
}
