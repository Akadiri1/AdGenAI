/**
 * HeyGen API integration for AI avatar video generation.
 * Docs: https://docs.heygen.com/reference
 *
 * When HEYGEN_API_KEY is not set, returns a placeholder/mock response
 * so the UI can be tested without a real API key.
 */

import type { VoiceSettings } from "@/lib/avatars";

const HEYGEN_BASE = "https://api.heygen.com/v2";

async function heygenRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) throw new Error("HEYGEN_API_KEY not configured");

  const res = await fetch(`${HEYGEN_BASE}${path}`, {
    ...init,
    headers: {
      "X-Api-Key": key,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HeyGen API error ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

export type GenerateAvatarVideoParams = {
  avatarId: string; // HeyGen avatar ID
  script: string;
  voiceId?: string; // HeyGen voice ID
  voiceSettings?: VoiceSettings;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  speechToSpeechAudioUrl?: string; // URL to user's recorded audio
};

export type AvatarVideoResult = {
  videoId: string;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  duration?: number;
};

/**
 * Generate a talking-head video with an AI avatar.
 */
export async function generateAvatarVideo(
  params: GenerateAvatarVideoParams,
): Promise<AvatarVideoResult> {
  if (!process.env.HEYGEN_API_KEY) {
    // Mock response for development
    return {
      videoId: `mock_${Date.now()}`,
      status: "pending",
      videoUrl: undefined,
    };
  }

  const dimension = params.aspectRatio === "9:16"
    ? { width: 1080, height: 1920 }
    : params.aspectRatio === "1:1"
      ? { width: 1080, height: 1080 }
      : { width: 1920, height: 1080 };

  const body: Record<string, unknown> = {
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id: params.avatarId,
          avatar_style: "normal",
        },
        voice: params.speechToSpeechAudioUrl
          ? {
              type: "audio",
              audio_url: params.speechToSpeechAudioUrl,
            }
          : {
              type: "text",
              input_text: params.script,
              voice_id: params.voiceId ?? "en-US-JennyNeural",
              speed: params.voiceSettings?.speed ?? 1.0,
              pitch: 0,
            },
      },
    ],
    dimension,
  };

  const result = await heygenRequest<{
    data: { video_id: string };
  }>("/video/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return {
    videoId: result.data.video_id,
    status: "processing",
  };
}

/**
 * Check the status of a video generation job.
 */
export async function getVideoStatus(videoId: string): Promise<AvatarVideoResult> {
  if (!process.env.HEYGEN_API_KEY || videoId.startsWith("mock_")) {
    return {
      videoId,
      status: "completed",
      videoUrl: `https://picsum.photos/seed/${videoId}/1080/1920`,
      duration: 15,
    };
  }

  const result = await heygenRequest<{
    data: {
      video_id: string;
      status: string;
      video_url?: string;
      duration?: number;
    };
  }>(`/video_status.get?video_id=${videoId}`);

  return {
    videoId: result.data.video_id,
    status: result.data.status as AvatarVideoResult["status"],
    videoUrl: result.data.video_url,
    duration: result.data.duration,
  };
}

/**
 * List available voices from HeyGen.
 */
export async function listVoices(): Promise<Array<{
  voiceId: string;
  name: string;
  language: string;
  gender: string;
  preview?: string;
}>> {
  if (!process.env.HEYGEN_API_KEY) {
    return [
      { voiceId: "en-US-JennyNeural", name: "Jenny", language: "English (US)", gender: "female" },
      { voiceId: "en-US-GuyNeural", name: "Guy", language: "English (US)", gender: "male" },
      { voiceId: "en-GB-SoniaNeural", name: "Sonia", language: "English (UK)", gender: "female" },
      { voiceId: "es-ES-ElviraNeural", name: "Elvira", language: "Spanish", gender: "female" },
      { voiceId: "fr-FR-DeniseNeural", name: "Denise", language: "French", gender: "female" },
      { voiceId: "de-DE-KatjaNeural", name: "Katja", language: "German", gender: "female" },
      { voiceId: "pt-BR-FranciscaNeural", name: "Francisca", language: "Portuguese (BR)", gender: "female" },
      { voiceId: "hi-IN-SwaraNeural", name: "Swara", language: "Hindi", gender: "female" },
      { voiceId: "ar-SA-ZariyahNeural", name: "Zariyah", language: "Arabic", gender: "female" },
      { voiceId: "ja-JP-NanamiNeural", name: "Nanami", language: "Japanese", gender: "female" },
    ];
  }

  const result = await heygenRequest<{
    data: { voices: Array<{ voice_id: string; display_name: string; language: string; gender: string; preview_audio?: string }> };
  }>("/voices");

  return result.data.voices.map((v) => ({
    voiceId: v.voice_id,
    name: v.display_name,
    language: v.language,
    gender: v.gender,
    preview: v.preview_audio,
  }));
}

export function isHeyGenConfigured(): boolean {
  return !!process.env.HEYGEN_API_KEY;
}
