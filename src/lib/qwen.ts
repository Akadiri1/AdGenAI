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

/**
 * Use Qwen Text to expand a short video prompt into a rich cinematic description.
 */
export async function extendPromptWithQwen(prompt: string): Promise<string> {
  const system = "You are an expert AI video director. Expand the user's short prompt into a detailed, cinematic description including lighting, camera movement, and textures. Keep it under 200 words.";
  try {
    const extended = await generateQwenText({ system, prompt: `Expand this for a high-quality video: ${prompt}` });
    return extended;
  } catch (e) {
    console.warn("[Qwen] Manual prompt extension failed, using original:", (e as Error).message);
    return prompt;
  }
}

// ── VIDEO GENERATION (WANX) ────────────────────────────────────────────────

export async function generateQwenVideo(params: {
  prompt: string;
  imageUrl?: string;
  duration?: 5 | 10;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  model?: string;
  promptExtend?: boolean;
}): Promise<{ taskId: string }> {
  const key = process.env.QWEN_API_KEY;
  if (!key) throw new Error("QWEN_API_KEY not set");

  // Default to turbo for better reliability if plus is failing
  const model = params.model ?? (params.imageUrl ? "wan2.1-i2v-plus" : "wan2.1-t2v-turbo");
  // Qwen API now requires "720P" or "480P" instead of pixel dimensions
  const resolutionMap = {
    "9:16": "720P",
    "16:9": "720P",
    "1:1": "720P"
  };

  let finalPrompt = params.prompt;
  let useInternalExtend = params.promptExtend ?? true;

  // If prompt is short and we want extension, but suspect internal rewriter is broken,
  // we do it manually.
  if (useInternalExtend && finalPrompt.length < 100) {
    console.log("[Qwen] Performing manual prompt extension...");
    finalPrompt = await extendPromptWithQwen(finalPrompt);
    useInternalExtend = false; // Disable internal since we did it manually
  }

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
        prompt: finalPrompt,
        ...(params.imageUrl && { img_url: params.imageUrl })
      },
      parameters: {
        resolution: resolutionMap[params.aspectRatio ?? "9:16"],
        duration: params.duration ?? 5,
        prompt_extend: useInternalExtend,
        aspect_ratio: params.aspectRatio ?? "9:16"
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

  console.log(`[Qwen] Task ${taskId} status: ${status}`, JSON.stringify(data.output).slice(0, 300));

  if (status === "SUCCEEDED") {
    let videoUrl = data.output?.video_url;
    // Fallback: some newer Qwen models return results array instead of video_url
    if (!videoUrl && data.output?.results?.[0]?.url) {
      videoUrl = data.output.results[0].url;
    }
    if (videoUrl && videoUrl.startsWith("http://")) {
      videoUrl = videoUrl.replace("http://", "https://");
    }
    if (!videoUrl) {
      console.error("[Qwen] SUCCEEDED but no video URL found in response:", JSON.stringify(data.output));
      return { status: "failed", error: "Video completed but no URL was returned by Qwen" };
    }
    return { status: "succeeded", videoUrl };
  } else if (status === "FAILED") {
    console.error("[Qwen] Task FAILED:", JSON.stringify(data.output));
    return { status: "failed", error: data.output?.message || data.output?.code || "Unknown Qwen error" };
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
  instructions?: string;
  voiceUrl?: string;
}): Promise<string> {
  const key = process.env.QWEN_API_KEY;
  if (!key) throw new Error("QWEN_API_KEY not set");

  // Determine model based on inputs
  // - If voiceUrl is provided, use Voice Cloning (vc)
  // - If instructions are provided, use Voice Design (instruct)
  // - Otherwise use standard flash
  let model = "qwen3-tts-flash";
  if (params.voiceUrl) {
    model = "qwen3-tts-vc-flash";
  } else if (params.instructions) {
    model = "qwen3-tts-instruct-flash";
  }

  // DashScope TTS v2 (CosyVoice based)
  const res = await fetch(`${DASHSCOPE_INTL_BASE}/services/aigc/multimodal-generation/generation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: { 
        text: params.text,
        ...(params.voiceUrl && { voice_url: params.voiceUrl })
      },
      parameters: {
        voice: params.voice ?? "Cherry",
        format: "mp3",
        speech_rate: params.speed ?? 1.0,
        ...(params.instructions && { instructions: params.instructions })
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
