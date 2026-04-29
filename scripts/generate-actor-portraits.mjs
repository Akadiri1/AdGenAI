/**
 * Generate AI headshots for every avatar in AVATAR_LIBRARY using Replicate FLUX-1.1-Pro,
 * upload them to R2, and write the mapping to scripts/actor-portraits.json.
 *
 * After this finishes, run:  node scripts/apply-actor-portraits.mjs
 * to patch src/lib/avatars.ts with the new URLs.
 *
 * Usage:
 *   node scripts/generate-actor-portraits.mjs                # generate ALL
 *   node scripts/generate-actor-portraits.mjs --limit=10     # smoke test
 *   node scripts/generate-actor-portraits.mjs --only=ava-001 # one specific actor
 *
 * Cost: ~$0.04 per image via FLUX-1.1-Pro. 100 actors ≈ $4.
 * Time: ~6-10 sec per image with concurrency 4 → ~5 minutes for 100.
 */
import "dotenv/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

// ---------------- Config ----------------
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const MODEL = "black-forest-labs/flux-1.1-pro";

const R2 = {
  endpoint: process.env.R2_ENDPOINT,
  bucket: process.env.R2_BUCKET,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  publicUrl: process.env.R2_PUBLIC_URL,
};

if (!REPLICATE_TOKEN) { console.error("❌ REPLICATE_API_TOKEN missing"); process.exit(1); }

const useR2 = !!(R2.endpoint && R2.bucket && R2.accessKeyId && R2.secretAccessKey && R2.publicUrl);
const s3 = useR2 ? new S3Client({
  region: "auto",
  endpoint: R2.endpoint,
  credentials: { accessKeyId: R2.accessKeyId, secretAccessKey: R2.secretAccessKey },
}) : null;
if (!useR2) {
  console.log("ℹ️  R2 not configured — saving portraits locally to public/actors/");
}

// ---------------- CLI args ----------------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const limit = args.limit ? parseInt(args.limit, 10) : Infinity;
const only = args.only;
const CONCURRENCY = parseInt(args.concurrency ?? "4", 10);

// ---------------- Actor specs (slim mirror of AVATAR_LIBRARY) ----------------
// Only fields the prompt builder needs: id, gender, age, ethnicity, vibe, setting.
const ACTORS = [
  // Original 30 (curated)
  { id: "ava-001", g: "female", age: "young",  eth: "Latina",         vibe: "friendly, casual",       set: "studio" },
  { id: "ava-002", g: "female", age: "young",  eth: "African",        vibe: "professional, confident", set: "office" },
  { id: "ava-003", g: "female", age: "young",  eth: "European",       vibe: "warm, lifestyle",        set: "cafe" },
  { id: "ava-004", g: "female", age: "young",  eth: "Asian",          vibe: "cozy, calm",             set: "home" },
  { id: "ava-005", g: "female", age: "young",  eth: "European",       vibe: "fashion, polished",      set: "airport" },
  { id: "ava-006", g: "female", age: "young",  eth: "South Asian",    vibe: "athletic, energetic",    set: "gym" },
  { id: "ava-007", g: "female", age: "young",  eth: "Latina",         vibe: "summer, playful",        set: "beach" },
  { id: "ava-008", g: "female", age: "young",  eth: "Asian",          vibe: "wellness, soft",         set: "outdoor nature" },
  { id: "ava-009", g: "female", age: "young",  eth: "Middle Eastern", vibe: "warm, lifestyle",        set: "home kitchen" },
  { id: "ava-010", g: "female", age: "young",  eth: "European",       vibe: "morning, fashion",       set: "balcony" },
  { id: "ava-040", g: "female", age: "middle", eth: "African American", vibe: "executive, polished",  set: "modern office" },
  { id: "ava-041", g: "female", age: "middle", eth: "European",       vibe: "warm, mom",              set: "home kitchen" },
  { id: "ava-042", g: "female", age: "middle", eth: "South Asian",    vibe: "confident, calm",        set: "studio" },
  { id: "ava-043", g: "female", age: "middle", eth: "Latina",         vibe: "active, real",           set: "outdoor" },
  { id: "ava-021", g: "female", age: "senior", eth: "European",       vibe: "trusted, warm",          set: "home" },
  { id: "ava-022", g: "female", age: "senior", eth: "European",       vibe: "wholesome, family",      set: "kitchen" },
  { id: "ava-023", g: "female", age: "senior", eth: "African",        vibe: "matriarch, confident",   set: "outdoor" },
  { id: "ava-011", g: "male",   age: "young",  eth: "African American", vibe: "casual, creative",     set: "studio" },
  { id: "ava-012", g: "male",   age: "young",  eth: "European",       vibe: "tech, focused",          set: "gaming setup" },
  { id: "ava-013", g: "male",   age: "young",  eth: "European",       vibe: "rugged, adventurer",     set: "outdoor mountains" },
  { id: "ava-014", g: "male",   age: "young",  eth: "Asian",          vibe: "creative, calm",         set: "cafe" },
  { id: "ava-015", g: "male",   age: "young",  eth: "Latino",         vibe: "luxury, lifestyle",      set: "luxury car" },
  { id: "ava-016", g: "male",   age: "young",  eth: "African",        vibe: "entrepreneur, confident", set: "modern home" },
  { id: "ava-017", g: "male",   age: "young",  eth: "South Asian",    vibe: "athletic, lean",         set: "gym" },
  { id: "ava-019", g: "male",   age: "young",  eth: "European",       vibe: "surfer, summer",         set: "beach" },
  { id: "ava-020", g: "male",   age: "young",  eth: "Latino",         vibe: "creator, charismatic",   set: "podcast studio" },
  { id: "ava-018", g: "male",   age: "middle", eth: "European",       vibe: "professional, polished", set: "office" },
  { id: "ava-024", g: "male",   age: "middle", eth: "Middle Eastern", vibe: "executive, trusted",     set: "office" },
  { id: "ava-025", g: "male",   age: "middle", eth: "European",       vibe: "dad, real",              set: "outdoor" },
  { id: "ava-026", g: "male",   age: "middle", eth: "Latino",         vibe: "chef, warm",             set: "kitchen" },
  { id: "ava-027", g: "male",   age: "middle", eth: "African American", vibe: "media, confident",     set: "studio" },
  { id: "ava-028", g: "male",   age: "senior", eth: "European",       vibe: "expert, trusted",        set: "office" },
  { id: "ava-029", g: "male",   age: "senior", eth: "African American", vibe: "warm, grandfather",    set: "home" },
  { id: "ava-030", g: "male",   age: "senior", eth: "Asian",          vibe: "expert, calm",           set: "studio" },

  // Extended pool — auto-generated for filter coverage
  { id: "ava-101", g: "female", age: "young",  eth: "European",       vibe: "fresh, beauty",          set: "studio" },
  { id: "ava-102", g: "female", age: "young",  eth: "African",        vibe: "bold, natural",          set: "studio" },
  { id: "ava-103", g: "female", age: "young",  eth: "European",       vibe: "entrepreneur, smart",    set: "modern office" },
  { id: "ava-104", g: "female", age: "young",  eth: "Asian",          vibe: "professional, smart",    set: "office" },
  { id: "ava-105", g: "female", age: "young",  eth: "Latina",         vibe: "energetic, traveler",    set: "outdoor" },
  { id: "ava-106", g: "female", age: "young",  eth: "European",       vibe: "wholesome, hiker",       set: "outdoor mountains" },
  { id: "ava-107", g: "female", age: "young",  eth: "African",        vibe: "honest, lifestyle",      set: "home" },
  { id: "ava-108", g: "female", age: "young",  eth: "European",       vibe: "soft, morning",          set: "home" },
  { id: "ava-109", g: "female", age: "young",  eth: "Asian",          vibe: "warm, foodie",           set: "cafe" },
  { id: "ava-110", g: "female", age: "young",  eth: "Latina",         vibe: "trendy, lifestyle",      set: "cafe" },
  { id: "ava-111", g: "female", age: "young",  eth: "African",        vibe: "strong, athleisure",     set: "gym" },
  { id: "ava-112", g: "female", age: "young",  eth: "South Asian",    vibe: "calm, yoga",             set: "yoga studio" },
  { id: "ava-113", g: "female", age: "young",  eth: "European",       vibe: "cozy, real",             set: "kitchen" },
  { id: "ava-114", g: "female", age: "young",  eth: "European",       vibe: "summer, fun",            set: "beach" },
  { id: "ava-115", g: "female", age: "young",  eth: "South Asian",    vibe: "smart, creator",         set: "podcast studio" },
  { id: "ava-130", g: "female", age: "middle", eth: "European",       vibe: "executive, leadership",  set: "modern office" },
  { id: "ava-131", g: "female", age: "middle", eth: "Latina",         vibe: "warm, professional",     set: "office" },
  { id: "ava-132", g: "female", age: "middle", eth: "African",        vibe: "polished, smart",        set: "office" },
  { id: "ava-133", g: "female", age: "middle", eth: "European",       vibe: "warm, mom",              set: "kitchen" },
  { id: "ava-134", g: "female", age: "middle", eth: "Latina",         vibe: "real, family",           set: "kitchen" },
  { id: "ava-135", g: "female", age: "middle", eth: "European",       vibe: "calm, honest",           set: "home" },
  { id: "ava-136", g: "female", age: "middle", eth: "Asian",          vibe: "minimal, soft",          set: "home" },
  { id: "ava-137", g: "female", age: "middle", eth: "South Asian",    vibe: "real, active",           set: "outdoor" },
  { id: "ava-138", g: "female", age: "middle", eth: "European",       vibe: "athletic, real",         set: "outdoor" },
  { id: "ava-139", g: "female", age: "middle", eth: "Latina",         vibe: "host, confident",        set: "studio" },
  { id: "ava-140", g: "female", age: "middle", eth: "African",        vibe: "media, trust",           set: "interview studio" },
  { id: "ava-141", g: "female", age: "middle", eth: "European",       vibe: "morning, quiet",         set: "balcony" },
  { id: "ava-160", g: "female", age: "senior", eth: "European",       vibe: "warm, grandmother",      set: "home" },
  { id: "ava-161", g: "female", age: "senior", eth: "European",       vibe: "honest, family",         set: "kitchen" },
  { id: "ava-162", g: "female", age: "senior", eth: "African American", vibe: "polished, executive",  set: "office" },
  { id: "ava-163", g: "female", age: "senior", eth: "Asian",          vibe: "calm, wellness",         set: "home" },
  { id: "ava-164", g: "female", age: "senior", eth: "Latina",         vibe: "warm, active",           set: "outdoor" },
  { id: "ava-165", g: "female", age: "senior", eth: "European",       vibe: "trust, testimonial",     set: "interview studio" },
  { id: "ava-166", g: "female", age: "senior", eth: "African",        vibe: "wisdom, calm",           set: "studio" },
  { id: "ava-167", g: "female", age: "senior", eth: "European",       vibe: "trust, healthcare",      set: "home" },
  { id: "ava-201", g: "male",   age: "young",  eth: "European",       vibe: "casual, creator",        set: "studio" },
  { id: "ava-202", g: "male",   age: "young",  eth: "African American", vibe: "bold, streetwear",     set: "studio" },
  { id: "ava-203", g: "male",   age: "young",  eth: "South Asian",    vibe: "smart, engineer",        set: "office" },
  { id: "ava-204", g: "male",   age: "young",  eth: "European",       vibe: "polished, finance",      set: "office" },
  { id: "ava-205", g: "male",   age: "young",  eth: "Latino",         vibe: "energetic, traveler",    set: "outdoor" },
  { id: "ava-206", g: "male",   age: "young",  eth: "European",       vibe: "rugged, hiker",          set: "outdoor mountains" },
  { id: "ava-207", g: "male",   age: "young",  eth: "African",        vibe: "warm, creator",          set: "home" },
  { id: "ava-208", g: "male",   age: "young",  eth: "European",       vibe: "calm, morning",          set: "home" },
  { id: "ava-209", g: "male",   age: "young",  eth: "Asian",          vibe: "minimal, creative",      set: "cafe" },
  { id: "ava-210", g: "male",   age: "young",  eth: "Latino",         vibe: "trendy, lifestyle",      set: "cafe" },
  { id: "ava-211", g: "male",   age: "young",  eth: "African American", vibe: "strong, athletic",     set: "gym" },
  { id: "ava-212", g: "male",   age: "young",  eth: "South Asian",    vibe: "lean, active",           set: "gym" },
  { id: "ava-213", g: "male",   age: "young",  eth: "European",       vibe: "warm, chef",             set: "kitchen" },
  { id: "ava-214", g: "male",   age: "young",  eth: "European",       vibe: "summer, surfer",         set: "beach" },
  { id: "ava-215", g: "male",   age: "young",  eth: "Asian",          vibe: "host, creator",          set: "podcast studio" },
  { id: "ava-230", g: "male",   age: "middle", eth: "European",       vibe: "executive, polished",    set: "modern office" },
  { id: "ava-231", g: "male",   age: "middle", eth: "African",        vibe: "leadership, smart",      set: "office" },
  { id: "ava-232", g: "male",   age: "middle", eth: "Latino",         vibe: "approachable, finance",  set: "office" },
  { id: "ava-233", g: "male",   age: "middle", eth: "European",       vibe: "confident, host",        set: "studio" },
  { id: "ava-234", g: "male",   age: "middle", eth: "European",       vibe: "real, dad",              set: "outdoor" },
  { id: "ava-235", g: "male",   age: "middle", eth: "South Asian",    vibe: "approachable, real",     set: "outdoor" },
  { id: "ava-236", g: "male",   age: "middle", eth: "Latino",         vibe: "warm, chef",             set: "kitchen" },
  { id: "ava-237", g: "male",   age: "middle", eth: "European",       vibe: "honest, dad",            set: "home" },
  { id: "ava-238", g: "male",   age: "middle", eth: "African",        vibe: "trusted, expert",        set: "interview studio" },
  { id: "ava-239", g: "male",   age: "middle", eth: "Latino",         vibe: "smart, host",            set: "podcast studio" },
  { id: "ava-240", g: "male",   age: "middle", eth: "European",       vibe: "lifestyle, real",        set: "luxury car" },
  { id: "ava-241", g: "male",   age: "middle", eth: "Asian",          vibe: "calm, minimal",          set: "balcony" },
  { id: "ava-260", g: "male",   age: "senior", eth: "European",       vibe: "trusted, expert",        set: "office" },
  { id: "ava-261", g: "male",   age: "senior", eth: "African American", vibe: "warm, grandfather",    set: "home" },
  { id: "ava-262", g: "male",   age: "senior", eth: "European",       vibe: "real, approachable",     set: "outdoor" },
  { id: "ava-263", g: "male",   age: "senior", eth: "Asian",          vibe: "calm, wisdom",           set: "studio" },
  { id: "ava-264", g: "male",   age: "senior", eth: "European",       vibe: "trust, testimonial",     set: "interview studio" },
  { id: "ava-265", g: "male",   age: "senior", eth: "Middle Eastern", vibe: "warm, family",           set: "kitchen" },
  { id: "ava-266", g: "male",   age: "senior", eth: "European",       vibe: "honest, dad",            set: "home" },
  { id: "ava-267", g: "male",   age: "senior", eth: "African",        vibe: "wisdom, mentor",         set: "office" },
  // Niche
  { id: "ava-301", g: "female", age: "young",  eth: "European",       vibe: "fresh, winter",          set: "snowy mountain" },
  { id: "ava-302", g: "female", age: "young",  eth: "European",       vibe: "active, ski",            set: "snowy slope" },
  { id: "ava-303", g: "male",   age: "young",  eth: "European",       vibe: "rugged, ski",            set: "snowy mountain" },
  { id: "ava-304", g: "male",   age: "middle", eth: "Middle Eastern", vibe: "warm, real",             set: "snowy outdoor" },
  { id: "ava-305", g: "female", age: "young",  eth: "European",       vibe: "real, trust",            set: "interview studio" },
  { id: "ava-306", g: "male",   age: "young",  eth: "South Asian",    vibe: "smart, professional",    set: "interview studio" },
  { id: "ava-307", g: "female", age: "young",  eth: "Asian",          vibe: "smart, host",            set: "podcast studio" },
  { id: "ava-308", g: "male",   age: "young",  eth: "African American", vibe: "deep, host",           set: "podcast studio" },
  { id: "ava-309", g: "female", age: "young",  eth: "European",       vibe: "neutral, creator",       set: "green screen studio" },
  { id: "ava-310", g: "male",   age: "middle", eth: "European",       vibe: "neutral, trust",         set: "green screen studio" },
  { id: "ava-311", g: "female", age: "young",  eth: "European",       vibe: "soft, morning",          set: "modern bathroom" },
  { id: "ava-312", g: "female", age: "young",  eth: "African",        vibe: "fresh, beauty",          set: "modern bathroom" },
  { id: "ava-313", g: "male",   age: "young",  eth: "Asian",          vibe: "minimal, calm",          set: "modern bathroom" },
  { id: "ava-314", g: "female", age: "middle", eth: "Latina",         vibe: "warm, morning",          set: "balcony" },
  { id: "ava-315", g: "female", age: "young",  eth: "European",       vibe: "calm, wellness",         set: "outdoor nature" },
  { id: "ava-316", g: "male",   age: "young",  eth: "Asian",          vibe: "calm, minimal",          set: "outdoor nature" },
  { id: "ava-317", g: "female", age: "young",  eth: "Latina",         vibe: "energetic, lifestyle",   set: "luxury car" },
  { id: "ava-318", g: "male",   age: "young",  eth: "European",       vibe: "luxury, lifestyle",      set: "luxury car" },
  { id: "ava-319", g: "male",   age: "young",  eth: "European",       vibe: "fun, gaming",            set: "gaming setup" },
  { id: "ava-320", g: "female", age: "young",  eth: "Latina",         vibe: "fun, creator",           set: "gaming setup" },
  { id: "ava-321", g: "male",   age: "young",  eth: "European",       vibe: "fashion, traveler",      set: "airport" },
  { id: "ava-322", g: "female", age: "middle", eth: "Latina",         vibe: "polished, professional", set: "airport" },
];

// ---------------- Prompt builder ----------------
const AGE_DESC = {
  young:  { female: "early-to-late twenties woman",  male: "early-to-late twenties man" },
  middle: { female: "late thirties to mid forties woman", male: "late thirties to mid forties man" },
  senior: { female: "sixty-something woman",         male: "sixty-something man" },
};

function buildPrompt({ g, age, eth, vibe, set }) {
  const subject = AGE_DESC[age][g];
  return `Candid selfie-style portrait of a real ${eth} ${subject} filming a TikTok or Instagram UGC video ad. ${vibe} energy. Looking directly at camera, relaxed and natural, slightly imperfect like a real content creator — not a model. Framed from chest up. Setting: ${set}. Natural ambient light, authentic everyday look. Shot on a modern smartphone front camera. Real skin texture, no heavy retouching, no airbrushing. No text overlays, no logos, no watermarks. Looks like a real person, not a stock photo.`;
}

// ---------------- Replicate call ----------------
async function generateOne(actor) {
  const prompt = buildPrompt(actor);
  const create = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      version: MODEL,
      input: {
        prompt,
        aspect_ratio: "1:1",
        output_format: "png",
        safety_tolerance: 2,
      },
    }),
  });
  if (!create.ok) throw new Error(`Replicate ${create.status}: ${await create.text()}`);
  const pred = await create.json();

  // Poll if not already done
  let status = pred.status;
  let output = pred.output;
  let id = pred.id;
  while (status === "starting" || status === "processing") {
    await new Promise((r) => setTimeout(r, 2500));
    const get = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` },
    });
    const data = await get.json();
    status = data.status; output = data.output;
    if (status === "failed" || status === "canceled") throw new Error(`Prediction ${status}: ${data.error}`);
  }
  const url = typeof output === "string" ? output : Array.isArray(output) ? output[0] : null;
  if (!url) throw new Error(`No output URL for ${actor.id}`);

  // Download bytes
  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error(`Image fetch ${imgRes.status}`);
  const bytes = Buffer.from(await imgRes.arrayBuffer());

  if (useR2) {
    const key = `actors/${actor.id}.png`;
    await s3.send(new PutObjectCommand({
      Bucket: R2.bucket,
      Key: key,
      Body: bytes,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000, immutable",
    }));
    return `${R2.publicUrl.replace(/\/$/, "")}/${key}`;
  }

  // Local fallback — write to public/actors so Next.js serves it at /actors/<id>.png
  const dir = path.resolve("public/actors");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${actor.id}.png`);
  await fs.writeFile(file, bytes);
  return `/actors/${actor.id}.png`;
}

// ---------------- Concurrency runner ----------------
async function runWithConcurrency(items, worker, n) {
  const results = {};
  let i = 0;
  let done = 0;
  const total = items.length;
  async function next() {
    while (i < items.length) {
      const idx = i++;
      const item = items[idx];
      const t0 = Date.now();
      try {
        const url = await worker(item);
        results[item.id] = url;
        done++;
        console.log(`[${done}/${total}] ✅ ${item.id}  (${((Date.now() - t0) / 1000).toFixed(1)}s)  ${url}`);
      } catch (e) {
        done++;
        console.error(`[${done}/${total}] ❌ ${item.id}  ${e.message}`);
        results[item.id] = { error: e.message };
      }
    }
  }
  await Promise.all(Array.from({ length: n }, next));
  return results;
}

// ---------------- Main ----------------
const work = ACTORS
  .filter((a) => !only || a.id === only)
  .slice(0, limit);

console.log(`\nGenerating ${work.length} portraits via FLUX-1.1-Pro (concurrency ${CONCURRENCY})...\n`);
const t0 = Date.now();
const mapping = await runWithConcurrency(work, generateOne, CONCURRENCY);

const outFile = path.resolve("scripts/actor-portraits.json");
// Merge with existing file if present
let existing = {};
try { existing = JSON.parse(await fs.readFile(outFile, "utf8")); } catch { /* first run */ }
const merged = { ...existing, ...mapping };
await fs.writeFile(outFile, JSON.stringify(merged, null, 2));

const successCount = Object.values(mapping).filter((v) => typeof v === "string").length;
console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s. ${successCount}/${work.length} succeeded.`);
console.log(`Mapping written to ${outFile}`);
console.log(`\nNext: node scripts/apply-actor-portraits.mjs`);
