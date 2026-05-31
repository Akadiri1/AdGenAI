/**
 * AI Avatar system.
 * 5 curated AI-generated actors for the launch library.
 * More actors unlock as the FLUX portrait pack expands.
 */

export type AvatarGender = "male" | "female" | "non-binary";
export type AvatarAge = "young" | "middle" | "senior";
export type AvatarSituation =
  | "studio" | "office" | "outdoor" | "home" | "cafe" | "gym" | "kitchen"
  | "airport" | "car" | "beach" | "snow" | "gaming" | "interview"
  | "podcast" | "green-screen" | "bathroom" | "balcony" | "nature";

export type Avatar = {
  id: string;
  name: string;
  gender: AvatarGender;
  age: AvatarAge;
  situation: AvatarSituation;
  ethnicity: string;
  thumbnailUrl: string;
  isPro: boolean;
  isHD: boolean;
  tags: string[];
  voiceId?: string;
  audioSamples?: {
    us?: string;
    uk?: string;
    ng?: string;
  };
};

// PORTRAIT_OVERRIDES_START
// FLUX-generated UGC-style portraits — selfie/creator style, not stock photos
const PORTRAIT_OVERRIDES: Record<string, string> = {
  "ava-001": "/actors/ava-001.png",
  "ava-003": "/actors/ava-003.png",
  "ava-011": "/actors/ava-011.png",
};
// PORTRAIT_OVERRIDES_END

function av(
  id: string,
  name: string,
  gender: AvatarGender,
  age: AvatarAge,
  situation: AvatarSituation,
  ethnicity: string,
  unsplashId: string,
  tags: string[],
  voiceId?: string,
): Avatar {
  const thumbnailUrl = PORTRAIT_OVERRIDES[id]
    ?? `https://images.unsplash.com/${unsplashId}?w=400&h=400&fit=crop&crop=faces`;
  return { id, name, gender, age, situation, ethnicity, thumbnailUrl, isPro: false, isHD: true, tags, voiceId };
}

export const AVATAR_LIBRARY: Avatar[] = [
  // --- Female ---
  {
    id: "ava-001",
    name: "Sofia",
    gender: "female",
    age: "young",
    situation: "studio",
    ethnicity: "latina",
    thumbnailUrl: PORTRAIT_OVERRIDES["ava-001"] ?? "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=faces",
    isPro: false,
    isHD: true,
    tags: ["friendly", "casual", "beauty"],
    voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah — ElevenLabs
  },
  // --- Male ---
  {
    id: "ava-011",
    name: "Marcus",
    gender: "male",
    age: "young",
    situation: "studio",
    ethnicity: "african-american",
    thumbnailUrl: PORTRAIT_OVERRIDES["ava-011"] ?? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces",
    isPro: false,
    isHD: true,
    tags: ["confident", "casual", "streetwear"],
    voiceId: "nPczCjzI2devNBz1zQrb", // Brian — ElevenLabs
  },
];

export type VoiceSettings = {
  speed: number;
  stability: number;
  similarity: number;
  styleExaggeration: number;
};

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  speed: 1.0,
  stability: 0.5,
  similarity: 0.5,
  styleExaggeration: 0.1,
};
