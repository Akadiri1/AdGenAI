/**
 * Stock AI actor library.
 * Each actor has a high-quality AI-generated headshot and metadata for filtering.
 *
 * The image URLs point to a curated set of headshots stored in our R2 bucket.
 * Until those uploads land, we use placeholder "ui-avatars" so the picker UI works.
 */

export type StockActor = {
  externalId: string; // stable id like "sa_aisha_lagos" — used as DB key
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  gender: "female" | "male" | "non-binary";
  ageRange: "young-adult" | "adult" | "mature" | "senior";
  ethnicity: string;
  vibe: "confident" | "friendly" | "energetic" | "calm" | "professional" | "edgy" | "warm";
  setting: "studio" | "home" | "office" | "outdoor" | "kitchen" | "gym" | "cafe" | "street";
  language: string; // primary language match
  voiceId?: string; // ElevenLabs voice id (filled later)
};

// Placeholder image generator — swap out with real R2-hosted headshots
// when stock library imagery is finalised.
function placeholder(name: string, color = "FF6B35"): string {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=fff&size=512&bold=true`;
}

export const STOCK_ACTORS: StockActor[] = [
  // Africa
  { externalId: "sa_aisha_lagos", name: "Aisha", imageUrl: placeholder("Aisha", "FF6B35"), gender: "female", ageRange: "young-adult", ethnicity: "African", vibe: "confident", setting: "outdoor", language: "en" },
  { externalId: "sa_kwame_accra", name: "Kwame", imageUrl: placeholder("Kwame", "2EC4B6"), gender: "male", ageRange: "adult", ethnicity: "African", vibe: "professional", setting: "office", language: "en" },
  { externalId: "sa_zara_nairobi", name: "Zara", imageUrl: placeholder("Zara", "F39C12"), gender: "female", ageRange: "adult", ethnicity: "African", vibe: "warm", setting: "home", language: "sw" },
  { externalId: "sa_tunde_lagos", name: "Tunde", imageUrl: placeholder("Tunde", "004E89"), gender: "male", ageRange: "young-adult", ethnicity: "African", vibe: "energetic", setting: "street", language: "yo" },
  { externalId: "sa_amara_capetown", name: "Amara", imageUrl: placeholder("Amara", "E74C3C"), gender: "female", ageRange: "mature", ethnicity: "African", vibe: "calm", setting: "studio", language: "en" },
  { externalId: "sa_jabari_johannesburg", name: "Jabari", imageUrl: placeholder("Jabari", "FF6B35"), gender: "male", ageRange: "young-adult", ethnicity: "African", vibe: "edgy", setting: "street", language: "en" },

  // North America
  { externalId: "sa_olivia_ny", name: "Olivia", imageUrl: placeholder("Olivia", "2EC4B6"), gender: "female", ageRange: "young-adult", ethnicity: "Caucasian", vibe: "friendly", setting: "cafe", language: "en" },
  { externalId: "sa_marcus_la", name: "Marcus", imageUrl: placeholder("Marcus", "004E89"), gender: "male", ageRange: "adult", ethnicity: "Caucasian", vibe: "confident", setting: "outdoor", language: "en" },
  { externalId: "sa_emma_chicago", name: "Emma", imageUrl: placeholder("Emma", "F39C12"), gender: "female", ageRange: "adult", ethnicity: "Caucasian", vibe: "professional", setting: "office", language: "en" },
  { externalId: "sa_jake_miami", name: "Jake", imageUrl: placeholder("Jake", "FF6B35"), gender: "male", ageRange: "young-adult", ethnicity: "Caucasian", vibe: "energetic", setting: "outdoor", language: "en" },
  { externalId: "sa_sophia_toronto", name: "Sophia", imageUrl: placeholder("Sophia", "E74C3C"), gender: "female", ageRange: "mature", ethnicity: "Caucasian", vibe: "warm", setting: "kitchen", language: "en" },
  { externalId: "sa_diego_austin", name: "Diego", imageUrl: placeholder("Diego", "2EC4B6"), gender: "male", ageRange: "adult", ethnicity: "Latino", vibe: "friendly", setting: "home", language: "es" },

  // Latin America
  { externalId: "sa_camila_saopaulo", name: "Camila", imageUrl: placeholder("Camila", "F39C12"), gender: "female", ageRange: "young-adult", ethnicity: "Latino", vibe: "energetic", setting: "street", language: "pt" },
  { externalId: "sa_mateo_buenosaires", name: "Mateo", imageUrl: placeholder("Mateo", "004E89"), gender: "male", ageRange: "adult", ethnicity: "Latino", vibe: "confident", setting: "studio", language: "es" },
  { externalId: "sa_isabella_mexico", name: "Isabella", imageUrl: placeholder("Isabella", "E74C3C"), gender: "female", ageRange: "adult", ethnicity: "Latino", vibe: "warm", setting: "home", language: "es" },

  // Europe
  { externalId: "sa_chloe_paris", name: "Chloe", imageUrl: placeholder("Chloe", "FF6B35"), gender: "female", ageRange: "young-adult", ethnicity: "Caucasian", vibe: "professional", setting: "cafe", language: "fr" },
  { externalId: "sa_lukas_berlin", name: "Lukas", imageUrl: placeholder("Lukas", "2EC4B6"), gender: "male", ageRange: "adult", ethnicity: "Caucasian", vibe: "calm", setting: "office", language: "de" },
  { externalId: "sa_giulia_milano", name: "Giulia", imageUrl: placeholder("Giulia", "F39C12"), gender: "female", ageRange: "adult", ethnicity: "Caucasian", vibe: "edgy", setting: "studio", language: "it" },
  { externalId: "sa_oliver_london", name: "Oliver", imageUrl: placeholder("Oliver", "004E89"), gender: "male", ageRange: "mature", ethnicity: "Caucasian", vibe: "professional", setting: "office", language: "en" },
  { externalId: "sa_maria_madrid", name: "Maria", imageUrl: placeholder("Maria", "E74C3C"), gender: "female", ageRange: "mature", ethnicity: "Caucasian", vibe: "warm", setting: "kitchen", language: "es" },

  // Asia
  { externalId: "sa_priya_mumbai", name: "Priya", imageUrl: placeholder("Priya", "FF6B35"), gender: "female", ageRange: "young-adult", ethnicity: "South Asian", vibe: "friendly", setting: "home", language: "hi" },
  { externalId: "sa_arjun_delhi", name: "Arjun", imageUrl: placeholder("Arjun", "2EC4B6"), gender: "male", ageRange: "adult", ethnicity: "South Asian", vibe: "confident", setting: "outdoor", language: "hi" },
  { externalId: "sa_mei_shanghai", name: "Mei", imageUrl: placeholder("Mei", "F39C12"), gender: "female", ageRange: "young-adult", ethnicity: "East Asian", vibe: "energetic", setting: "street", language: "zh" },
  { externalId: "sa_haruto_tokyo", name: "Haruto", imageUrl: placeholder("Haruto", "004E89"), gender: "male", ageRange: "adult", ethnicity: "East Asian", vibe: "professional", setting: "office", language: "ja" },
  { externalId: "sa_sakura_kyoto", name: "Sakura", imageUrl: placeholder("Sakura", "E74C3C"), gender: "female", ageRange: "adult", ethnicity: "East Asian", vibe: "calm", setting: "studio", language: "ja" },
  { externalId: "sa_jin_seoul", name: "Jin", imageUrl: placeholder("Jin", "FF6B35"), gender: "male", ageRange: "young-adult", ethnicity: "East Asian", vibe: "edgy", setting: "street", language: "ko" },

  // Middle East
  { externalId: "sa_layla_dubai", name: "Layla", imageUrl: placeholder("Layla", "2EC4B6"), gender: "female", ageRange: "young-adult", ethnicity: "Middle Eastern", vibe: "confident", setting: "studio", language: "ar" },
  { externalId: "sa_omar_cairo", name: "Omar", imageUrl: placeholder("Omar", "F39C12"), gender: "male", ageRange: "adult", ethnicity: "Middle Eastern", vibe: "warm", setting: "cafe", language: "ar" },

  // Oceania / Pacific
  { externalId: "sa_zoe_sydney", name: "Zoe", imageUrl: placeholder("Zoe", "004E89"), gender: "female", ageRange: "young-adult", ethnicity: "Caucasian", vibe: "energetic", setting: "outdoor", language: "en" },
  { externalId: "sa_ethan_auckland", name: "Ethan", imageUrl: placeholder("Ethan", "E74C3C"), gender: "male", ageRange: "adult", ethnicity: "Caucasian", vibe: "friendly", setting: "outdoor", language: "en" },

  // Mature voices that often outperform for high-trust products
  { externalId: "sa_grace_boston", name: "Grace", imageUrl: placeholder("Grace", "FF6B35"), gender: "female", ageRange: "senior", ethnicity: "Caucasian", vibe: "warm", setting: "home", language: "en" },
  { externalId: "sa_henry_seattle", name: "Henry", imageUrl: placeholder("Henry", "2EC4B6"), gender: "male", ageRange: "senior", ethnicity: "Caucasian", vibe: "professional", setting: "office", language: "en" },
];

export const ACTOR_FILTERS = {
  gender: ["female", "male", "non-binary"] as const,
  ageRange: ["young-adult", "adult", "mature", "senior"] as const,
  vibe: ["confident", "friendly", "energetic", "calm", "professional", "edgy", "warm"] as const,
  setting: ["studio", "home", "office", "outdoor", "kitchen", "gym", "cafe", "street"] as const,
};
