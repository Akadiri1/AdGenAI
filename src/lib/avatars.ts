/**
 * AI Avatar system — built-in library + HeyGen API integration.
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
  audioSamples?: {
    us?: string;
    uk?: string;
    ng?: string;
  };
};

export const AVATAR_LIBRARY: Avatar[] = [
  { 
    id: "ava-001", name: "Sofia", gender: "female", age: "young", situation: "studio", ethnicity: "latina", 
    thumbnailUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop", 
    isPro: false, isHD: true, tags: ["casual", "friendly", "beauty"],
    audioSamples: { 
      us: "https://famousli-assets.s3.amazonaws.com/samples/sofia-us.mp3",
      uk: "https://famousli-assets.s3.amazonaws.com/samples/sofia-uk.mp3"
    } 
  },
  { 
    id: "ava-002", name: "Aisha", gender: "female", age: "young", situation: "office", ethnicity: "african", 
    thumbnailUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=400&fit=crop", 
    isPro: false, isHD: true, tags: ["professional", "tech", "business"],
    audioSamples: { 
      ng: "https://famousli-assets.s3.amazonaws.com/samples/aisha-ng.mp3",
      us: "https://famousli-assets.s3.amazonaws.com/samples/aisha-us.mp3"
    }
  },
  { 
    id: "ava-003", name: "Emma", gender: "female", age: "young", situation: "cafe", ethnicity: "european", 
    thumbnailUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop", 
    isPro: false, isHD: true, tags: ["lifestyle", "casual", "food"],
    audioSamples: { uk: "https://famousli-assets.s3.amazonaws.com/samples/emma-uk.mp3" }
  },
  { 
    id: "ava-004", name: "Yuki", gender: "female", age: "young", situation: "home", ethnicity: "asian", 
    thumbnailUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop", 
    isPro: false, isHD: true, tags: ["cozy", "wellness", "skincare"],
    audioSamples: { us: "https://famousli-assets.s3.amazonaws.com/samples/yuki-us.mp3" }
  },
  { 
    id: "ava-005", name: "Nicole", gender: "female", age: "young", situation: "airport", ethnicity: "european", 
    thumbnailUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop", 
    isPro: true, isHD: true, tags: ["travel", "fashion", "luxury"],
    audioSamples: { us: "https://famousli-assets.s3.amazonaws.com/samples/nicole-us.mp3" }
  },
  { 
    id: "ava-006", name: "Priya", gender: "female", age: "young", situation: "gym", ethnicity: "south-asian", 
    thumbnailUrl: "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=400&fit=crop", 
    isPro: false, isHD: true, tags: ["fitness", "health", "active"],
    audioSamples: { us: "https://famousli-assets.s3.amazonaws.com/samples/priya-us.mp3" }
  },
  
  { 
    id: "ava-011", name: "Marcus", gender: "male", age: "young", situation: "studio", ethnicity: "african-american", 
    thumbnailUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop", 
    isPro: false, isHD: true, tags: ["casual", "music", "streetwear"],
    audioSamples: { us: "https://famousli-assets.s3.amazonaws.com/samples/marcus-us.mp3" }
  },
  { 
    id: "ava-012", name: "Caleb", gender: "male", age: "young", situation: "gaming", ethnicity: "european", 
    thumbnailUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop", 
    isPro: false, isHD: true, tags: ["gaming", "tech", "esports"],
    audioSamples: { us: "https://famousli-assets.s3.amazonaws.com/samples/caleb-us.mp3" }
  },
  { 
    id: "ava-014", name: "Kenji", gender: "male", age: "young", situation: "cafe", ethnicity: "asian", 
    thumbnailUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop", 
    isPro: false, isHD: true, tags: ["lifestyle", "coffee", "creative"],
    audioSamples: { us: "https://famousli-assets.s3.amazonaws.com/samples/kenji-us.mp3" }
  },
  { 
    id: "ava-015", name: "Diego", gender: "male", age: "young", situation: "car", ethnicity: "latino", 
    thumbnailUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop", 
    isPro: true, isHD: true, tags: ["automotive", "luxury", "lifestyle"],
    audioSamples: { us: "https://famousli-assets.s3.amazonaws.com/samples/diego-us.mp3" }
  },

  { 
    id: "ava-018", name: "David", gender: "male", age: "middle", situation: "office", ethnicity: "european", 
    thumbnailUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop", 
    isPro: false, isHD: true, tags: ["professional", "finance", "consulting"],
    audioSamples: { us: "https://famousli-assets.s3.amazonaws.com/samples/david-us.mp3" }
  },
  { 
    id: "ava-021", name: "Margaret", gender: "female", age: "senior", situation: "home", ethnicity: "european", 
    thumbnailUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop", 
    isPro: false, isHD: true, tags: ["trusted", "testimonial", "healthcare"],
    audioSamples: { us: "https://famousli-assets.s3.amazonaws.com/samples/margaret-us.mp3" }
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

export function filterAvatars(filters: {
  gender?: AvatarGender;
  age?: AvatarAge;
  situation?: AvatarSituation;
  search?: string;
  showProOnly?: boolean;
}): Avatar[] {
  return AVATAR_LIBRARY.filter((a) => {
    if (filters.gender && a.gender !== filters.gender) return false;
    if (filters.age && a.age !== filters.age) return false;
    if (filters.situation && a.situation !== filters.situation) return false;
    if (filters.showProOnly && !a.isPro) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.tags.some((t) => t.includes(q)) ||
        a.ethnicity.includes(q) ||
        a.situation.includes(q)
      );
    }
    return true;
  });
}

export const SITUATIONS: AvatarSituation[] = [
  "studio", "office", "outdoor", "home", "cafe", "gym", "kitchen",
  "airport", "car", "beach", "snow", "gaming", "interview",
  "podcast", "green-screen", "bathroom", "balcony", "nature",
];
