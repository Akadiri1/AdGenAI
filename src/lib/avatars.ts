/**
 * AI Avatar system — built-in library + HeyGen API integration.
 * When HEYGEN_API_KEY is set, uses real AI avatars with lip-sync.
 * Without it, the UI is fully functional but generation returns a placeholder.
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
  isPro: boolean; // requires paid plan
  isHD: boolean;
  tags: string[];
};

// Built-in avatar library — these map to HeyGen avatar IDs when API is connected
// Thumbnails are placeholders until real avatar previews are added
export const AVATAR_LIBRARY: Avatar[] = [
  // Female - Young
  { id: "ava-001", name: "Sofia", gender: "female", age: "young", situation: "studio", ethnicity: "latina", thumbnailUrl: "", isPro: false, isHD: true, tags: ["casual", "friendly", "beauty"] },
  { id: "ava-002", name: "Aisha", gender: "female", age: "young", situation: "office", ethnicity: "african", thumbnailUrl: "", isPro: false, isHD: true, tags: ["professional", "tech", "business"] },
  { id: "ava-003", name: "Emma", gender: "female", age: "young", situation: "cafe", ethnicity: "european", thumbnailUrl: "", isPro: false, isHD: true, tags: ["lifestyle", "casual", "food"] },
  { id: "ava-004", name: "Yuki", gender: "female", age: "young", situation: "home", ethnicity: "asian", thumbnailUrl: "", isPro: false, isHD: true, tags: ["cozy", "wellness", "skincare"] },
  { id: "ava-005", name: "Nicole", gender: "female", age: "young", situation: "airport", ethnicity: "european", thumbnailUrl: "", isPro: true, isHD: true, tags: ["travel", "fashion", "luxury"] },
  { id: "ava-006", name: "Priya", gender: "female", age: "young", situation: "gym", ethnicity: "south-asian", thumbnailUrl: "", isPro: false, isHD: true, tags: ["fitness", "health", "active"] },
  { id: "ava-007", name: "Megan", gender: "female", age: "young", situation: "outdoor", ethnicity: "european", thumbnailUrl: "", isPro: false, isHD: false, tags: ["nature", "adventure", "sport"] },
  { id: "ava-008", name: "Zara", gender: "female", age: "young", situation: "interview", ethnicity: "middle-eastern", thumbnailUrl: "", isPro: true, isHD: true, tags: ["interview", "podcast", "professional"] },

  // Female - Middle
  { id: "ava-009", name: "Jennifer", gender: "female", age: "middle", situation: "office", ethnicity: "european", thumbnailUrl: "", isPro: false, isHD: true, tags: ["corporate", "leadership", "finance"] },
  { id: "ava-010", name: "Amara", gender: "female", age: "middle", situation: "kitchen", ethnicity: "african", thumbnailUrl: "", isPro: false, isHD: true, tags: ["food", "cooking", "family"] },

  // Male - Young
  { id: "ava-011", name: "Marcus", gender: "male", age: "young", situation: "studio", ethnicity: "african-american", thumbnailUrl: "", isPro: false, isHD: true, tags: ["casual", "music", "streetwear"] },
  { id: "ava-012", name: "Caleb", gender: "male", age: "young", situation: "gaming", ethnicity: "european", thumbnailUrl: "", isPro: false, isHD: true, tags: ["gaming", "tech", "esports"] },
  { id: "ava-013", name: "Robert", gender: "male", age: "young", situation: "outdoor", ethnicity: "european", thumbnailUrl: "", isPro: false, isHD: true, tags: ["casual", "sport", "hat"] },
  { id: "ava-014", name: "Kenji", gender: "male", age: "young", situation: "cafe", ethnicity: "asian", thumbnailUrl: "", isPro: false, isHD: true, tags: ["lifestyle", "coffee", "creative"] },
  { id: "ava-015", name: "Diego", gender: "male", age: "young", situation: "car", ethnicity: "latino", thumbnailUrl: "", isPro: true, isHD: true, tags: ["automotive", "luxury", "lifestyle"] },
  { id: "ava-016", name: "Ahmed", gender: "male", age: "young", situation: "interview", ethnicity: "middle-eastern", thumbnailUrl: "", isPro: false, isHD: true, tags: ["interview", "business", "startup"] },
  { id: "ava-017", name: "Kevin", gender: "male", age: "young", situation: "home", ethnicity: "european", thumbnailUrl: "", isPro: false, isHD: false, tags: ["casual", "home", "review"] },

  // Male - Middle
  { id: "ava-018", name: "David", gender: "male", age: "middle", situation: "office", ethnicity: "european", thumbnailUrl: "", isPro: false, isHD: true, tags: ["professional", "finance", "consulting"] },
  { id: "ava-019", name: "James", gender: "male", age: "middle", situation: "podcast", ethnicity: "african-american", thumbnailUrl: "", isPro: true, isHD: true, tags: ["podcast", "thought-leader", "speaker"] },
  { id: "ava-020", name: "Chen", gender: "male", age: "middle", situation: "studio", ethnicity: "asian", thumbnailUrl: "", isPro: false, isHD: true, tags: ["professional", "education", "tech"] },

  // Senior
  { id: "ava-021", name: "Margaret", gender: "female", age: "senior", situation: "home", ethnicity: "european", thumbnailUrl: "", isPro: false, isHD: true, tags: ["trusted", "testimonial", "healthcare"] },
  { id: "ava-022", name: "William", gender: "male", age: "senior", situation: "office", ethnicity: "european", thumbnailUrl: "", isPro: false, isHD: true, tags: ["authority", "finance", "insurance"] },
];

export type VoiceSettings = {
  speed: number; // 0.5 - 2.0 (1.0 = normal)
  stability: number; // 0.0 - 1.0 (lower = more dynamic/natural, higher = consistent)
  similarity: number; // 0.0 - 1.0 (how closely it matches punctuation)
  styleExaggeration: number; // 0.0 - 1.0 (0 = neutral, 1 = dramatic)
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
