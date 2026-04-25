// Seed the Actor table with the stock library.
// Run: node scripts/seed-actors.mjs
import { PrismaClient } from "@prisma/client";

// Inline the stock list to avoid TS imports
const STOCK_ACTORS = [
  { externalId: "sa_aisha_lagos", name: "Aisha", color: "FF6B35", gender: "female", ageRange: "young-adult", ethnicity: "African", vibe: "confident", setting: "outdoor", language: "en" },
  { externalId: "sa_kwame_accra", name: "Kwame", color: "2EC4B6", gender: "male", ageRange: "adult", ethnicity: "African", vibe: "professional", setting: "office", language: "en" },
  { externalId: "sa_zara_nairobi", name: "Zara", color: "F39C12", gender: "female", ageRange: "adult", ethnicity: "African", vibe: "warm", setting: "home", language: "sw" },
  { externalId: "sa_tunde_lagos", name: "Tunde", color: "004E89", gender: "male", ageRange: "young-adult", ethnicity: "African", vibe: "energetic", setting: "street", language: "yo" },
  { externalId: "sa_amara_capetown", name: "Amara", color: "E74C3C", gender: "female", ageRange: "mature", ethnicity: "African", vibe: "calm", setting: "studio", language: "en" },
  { externalId: "sa_jabari_johannesburg", name: "Jabari", color: "FF6B35", gender: "male", ageRange: "young-adult", ethnicity: "African", vibe: "edgy", setting: "street", language: "en" },
  { externalId: "sa_olivia_ny", name: "Olivia", color: "2EC4B6", gender: "female", ageRange: "young-adult", ethnicity: "Caucasian", vibe: "friendly", setting: "cafe", language: "en" },
  { externalId: "sa_marcus_la", name: "Marcus", color: "004E89", gender: "male", ageRange: "adult", ethnicity: "Caucasian", vibe: "confident", setting: "outdoor", language: "en" },
  { externalId: "sa_emma_chicago", name: "Emma", color: "F39C12", gender: "female", ageRange: "adult", ethnicity: "Caucasian", vibe: "professional", setting: "office", language: "en" },
  { externalId: "sa_jake_miami", name: "Jake", color: "FF6B35", gender: "male", ageRange: "young-adult", ethnicity: "Caucasian", vibe: "energetic", setting: "outdoor", language: "en" },
  { externalId: "sa_sophia_toronto", name: "Sophia", color: "E74C3C", gender: "female", ageRange: "mature", ethnicity: "Caucasian", vibe: "warm", setting: "kitchen", language: "en" },
  { externalId: "sa_diego_austin", name: "Diego", color: "2EC4B6", gender: "male", ageRange: "adult", ethnicity: "Latino", vibe: "friendly", setting: "home", language: "es" },
  { externalId: "sa_camila_saopaulo", name: "Camila", color: "F39C12", gender: "female", ageRange: "young-adult", ethnicity: "Latino", vibe: "energetic", setting: "street", language: "pt" },
  { externalId: "sa_mateo_buenosaires", name: "Mateo", color: "004E89", gender: "male", ageRange: "adult", ethnicity: "Latino", vibe: "confident", setting: "studio", language: "es" },
  { externalId: "sa_isabella_mexico", name: "Isabella", color: "E74C3C", gender: "female", ageRange: "adult", ethnicity: "Latino", vibe: "warm", setting: "home", language: "es" },
  { externalId: "sa_chloe_paris", name: "Chloe", color: "FF6B35", gender: "female", ageRange: "young-adult", ethnicity: "Caucasian", vibe: "professional", setting: "cafe", language: "fr" },
  { externalId: "sa_lukas_berlin", name: "Lukas", color: "2EC4B6", gender: "male", ageRange: "adult", ethnicity: "Caucasian", vibe: "calm", setting: "office", language: "de" },
  { externalId: "sa_giulia_milano", name: "Giulia", color: "F39C12", gender: "female", ageRange: "adult", ethnicity: "Caucasian", vibe: "edgy", setting: "studio", language: "it" },
  { externalId: "sa_oliver_london", name: "Oliver", color: "004E89", gender: "male", ageRange: "mature", ethnicity: "Caucasian", vibe: "professional", setting: "office", language: "en" },
  { externalId: "sa_maria_madrid", name: "Maria", color: "E74C3C", gender: "female", ageRange: "mature", ethnicity: "Caucasian", vibe: "warm", setting: "kitchen", language: "es" },
  { externalId: "sa_priya_mumbai", name: "Priya", color: "FF6B35", gender: "female", ageRange: "young-adult", ethnicity: "South Asian", vibe: "friendly", setting: "home", language: "hi" },
  { externalId: "sa_arjun_delhi", name: "Arjun", color: "2EC4B6", gender: "male", ageRange: "adult", ethnicity: "South Asian", vibe: "confident", setting: "outdoor", language: "hi" },
  { externalId: "sa_mei_shanghai", name: "Mei", color: "F39C12", gender: "female", ageRange: "young-adult", ethnicity: "East Asian", vibe: "energetic", setting: "street", language: "zh" },
  { externalId: "sa_haruto_tokyo", name: "Haruto", color: "004E89", gender: "male", ageRange: "adult", ethnicity: "East Asian", vibe: "professional", setting: "office", language: "ja" },
  { externalId: "sa_sakura_kyoto", name: "Sakura", color: "E74C3C", gender: "female", ageRange: "adult", ethnicity: "East Asian", vibe: "calm", setting: "studio", language: "ja" },
  { externalId: "sa_jin_seoul", name: "Jin", color: "FF6B35", gender: "male", ageRange: "young-adult", ethnicity: "East Asian", vibe: "edgy", setting: "street", language: "ko" },
  { externalId: "sa_layla_dubai", name: "Layla", color: "2EC4B6", gender: "female", ageRange: "young-adult", ethnicity: "Middle Eastern", vibe: "confident", setting: "studio", language: "ar" },
  { externalId: "sa_omar_cairo", name: "Omar", color: "F39C12", gender: "male", ageRange: "adult", ethnicity: "Middle Eastern", vibe: "warm", setting: "cafe", language: "ar" },
  { externalId: "sa_zoe_sydney", name: "Zoe", color: "004E89", gender: "female", ageRange: "young-adult", ethnicity: "Caucasian", vibe: "energetic", setting: "outdoor", language: "en" },
  { externalId: "sa_ethan_auckland", name: "Ethan", color: "E74C3C", gender: "male", ageRange: "adult", ethnicity: "Caucasian", vibe: "friendly", setting: "outdoor", language: "en" },
  { externalId: "sa_grace_boston", name: "Grace", color: "FF6B35", gender: "female", ageRange: "senior", ethnicity: "Caucasian", vibe: "warm", setting: "home", language: "en" },
  { externalId: "sa_henry_seattle", name: "Henry", color: "2EC4B6", gender: "male", ageRange: "senior", ethnicity: "Caucasian", vibe: "professional", setting: "office", language: "en" },
];

const prisma = new PrismaClient();

function placeholder(name, color) {
  const initials = name.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=fff&size=512&bold=true`;
}

let created = 0, updated = 0;
for (const a of STOCK_ACTORS) {
  const existing = await prisma.actor.findFirst({ where: { name: a.name, isStock: true } });
  const data = {
    name: a.name,
    imageUrl: placeholder(a.name, a.color),
    thumbnailUrl: placeholder(a.name, a.color),
    gender: a.gender,
    ageRange: a.ageRange,
    ethnicity: a.ethnicity,
    vibe: a.vibe,
    setting: a.setting,
    language: a.language,
    isStock: true,
    isPublic: true,
  };
  if (existing) {
    await prisma.actor.update({ where: { id: existing.id }, data });
    updated++;
  } else {
    await prisma.actor.create({ data });
    created++;
  }
}

console.log(`Stock actors: ${created} created, ${updated} updated`);
await prisma.$disconnect();
