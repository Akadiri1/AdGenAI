/**
 * ElevenLabs TTS client.
 * Generates audio from text and uploads it to our storage so Kling Lip Sync
 * can fetch it via public URL.
 *
 * Voices: https://elevenlabs.io/app/voice-library — these defaults are well-known
 * pre-built voices that exist on every ElevenLabs account.
 */
import { uploadToStorage } from "@/lib/storage";

const API_BASE = "https://api.elevenlabs.io/v1";

export function isElevenLabsConfigured(): boolean {
  return !!process.env.ELEVENLABS_API_KEY;
}

export type ElevenLabsVoiceSettings = {
  stability?: number;       // 0-1, default 0.5
  similarity_boost?: number; // 0-1, default 0.75
  style?: number;            // 0-1, default 0
  use_speaker_boost?: boolean;
  speed?: number;            // 0.7-1.2, default 1.0
};

const DEFAULT_VOICES = {
  // Pre-built ElevenLabs voices — stable IDs that ship with every account
  "female-warm":    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },     // young female, conversational
  "female-upbeat":  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily" },      // bright female
  "female-mature":  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },    // calm female
  "male-warm":      { id: "nPczCjzI2devNBz1zQrb", name: "Brian" },     // deep male
  "male-friendly":  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam" },      // young male
  "male-deep":      { id: "pqHfZKP75CvOlQylNhV4", name: "Bill" },      // older male
} as const;

export type VoiceKey = keyof typeof DEFAULT_VOICES;

/** Pick a voice by gender + age, with optional vibe nudges. */
export function pickElevenLabsVoice(params: {
  gender?: string | null;
  age?: string | null;
  vibe?: string | null;
}): { id: string; name: string; key: VoiceKey } {
  const isMale = params.gender === "male";
  // Accept both simple ("young","senior") and DB-style ("young-adult","mature") age values
  const normalizedAge = params.age?.replace("young-adult", "young").replace("adult", "middle").replace("mature", "senior") ?? "";
  const isYoung = normalizedAge === "young";
  const vibe = (params.vibe ?? "").toLowerCase();

  let key: VoiceKey;
  if (isMale) {
    if (normalizedAge === "senior" || vibe.includes("trust")) key = "male-deep";
    else if (isYoung || vibe.includes("energetic")) key = "male-friendly";
    else key = "male-warm";
  } else {
    if (normalizedAge === "senior" || vibe.includes("calm")) key = "female-mature";
    else if (vibe.includes("energetic") || vibe.includes("bold")) key = "female-upbeat";
    else key = "female-warm";
  }
  const voice = DEFAULT_VOICES[key];
  return { id: voice.id, name: voice.name, key };
}

export async function generateElevenLabsVoice(params: {
  text: string;
  voiceId: string;
  settings?: ElevenLabsVoiceSettings;
  modelId?: string; // "eleven_multilingual_v2" handles 29 languages well
}): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set");

  const res = await fetch(`${API_BASE}/text-to-speech/${params.voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: params.text,
      model_id: params.modelId ?? "eleven_multilingual_v2",
      voice_settings: {
        stability: params.settings?.stability ?? 0.5,
        similarity_boost: params.settings?.similarity_boost ?? 0.75,
        style: params.settings?.style ?? 0,
        use_speaker_boost: params.settings?.use_speaker_boost ?? true,
        ...(params.settings?.speed !== undefined && { speed: params.settings.speed }),
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${errText.slice(0, 300)}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return uploadToStorage({
    bytes: buf,
    contentType: "audio/mpeg",
    extension: "mp3",
    folder: "ads/voiceovers",
  });
}
