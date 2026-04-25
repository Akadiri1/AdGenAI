/**
 * TTS abstraction.
 * Picks the best available provider:
 *   1. ElevenLabs (premium quality, supports voice settings + 29 languages) — preferred
 *   2. Kokoro on Replicate (free-tier friendly, English only, no voice cloning)
 */
import {
  isElevenLabsConfigured,
  generateElevenLabsVoice,
  pickElevenLabsVoice,
  type ElevenLabsVoiceSettings,
} from "@/lib/elevenlabs";
import { generateVoiceover as kokoroVoice, pickVoiceForActor as kokoroPickVoice } from "@/lib/replicate";

export type VoiceoverInput = {
  text: string;
  /** Stored UI sliders (speed 0.5–2, stability 0–1, similarity 0–1, styleExaggeration 0–1) */
  settings?: {
    speed?: number;
    stability?: number;
    similarity?: number;
    styleExaggeration?: number;
    voiceId?: string; // explicit override
  };
  /** Used for default voice selection when no voiceId set */
  actor?: { gender?: string | null; age?: string | null; vibe?: string | null };
  language?: string;
};

export type VoiceoverResult = {
  audioUrl: string;
  provider: "elevenlabs" | "kokoro";
  voiceName: string;
};

export async function generateVoiceover(input: VoiceoverInput): Promise<VoiceoverResult> {
  // Premium path: ElevenLabs
  if (isElevenLabsConfigured()) {
    const picked = input.settings?.voiceId
      ? { id: input.settings.voiceId, name: input.settings.voiceId }
      : pickElevenLabsVoice({
          gender: input.actor?.gender,
          age: input.actor?.age,
          vibe: input.actor?.vibe,
        });

    // Map our 0-1 sliders into ElevenLabs ranges
    const elSettings: ElevenLabsVoiceSettings = {
      stability: clamp(input.settings?.stability ?? 0.5, 0, 1),
      similarity_boost: clamp(input.settings?.similarity ?? 0.75, 0, 1),
      style: clamp(input.settings?.styleExaggeration ?? 0, 0, 1),
      use_speaker_boost: true,
      speed: clamp(input.settings?.speed ?? 1.0, 0.7, 1.2),
    };

    const audioUrl = await generateElevenLabsVoice({
      text: input.text,
      voiceId: picked.id,
      settings: elSettings,
    });
    return { audioUrl, provider: "elevenlabs", voiceName: picked.name };
  }

  // Fallback: Kokoro (free-tier, English only)
  const voice = kokoroPickVoice(input.actor?.gender ?? null);
  const audioUrl = await kokoroVoice({
    text: input.text,
    voice,
    speed: input.settings?.speed,
  });
  return { audioUrl, provider: "kokoro", voiceName: voice };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
