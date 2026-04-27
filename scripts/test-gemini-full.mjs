/**
 * Full Gemini API test — text, Imagen 3 (image gen), and Veo 2 (video gen).
 * Run: node scripts/test-gemini-full.mjs
 */
import "dotenv/config";

const key = process.env.GEMINI_API_KEY;
if (!key) { console.error("❌ GEMINI_API_KEY not set"); process.exit(1); }
console.log("Key prefix:", key.slice(0, 12) + "...\n");

const BASE = "https://generativelanguage.googleapis.com/v1beta";

// ── 1. Text (Gemini 2.0 Flash) ──────────────────────────────────────────────
console.log("1. Testing Gemini 2.0 Flash (text)...");
try {
  const r = await fetch(`${BASE}/models/gemini-2.0-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with exactly: ok" }] }] }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(d));
  console.log("   ✅ Gemini text works:", d.candidates?.[0]?.content?.parts?.[0]?.text?.trim());
} catch (e) { console.error("   ❌ Gemini text failed:", e.message); }

// ── 2. Imagen 3 (image generation) ─────────────────────────────────────────
console.log("\n2. Testing Imagen 3 (image generation)...");
try {
  const r = await fetch(`${BASE}/models/imagen-3.0-generate-002:predict?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt: "A sleek black wireless headphone on a white surface, product photography" }],
      parameters: { sampleCount: 1, aspectRatio: "1:1" },
    }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(d).slice(0, 300));
  const hasImage = d.predictions?.[0]?.bytesBase64Encoded?.length > 0;
  console.log("   ✅ Imagen 3 works — got image:", hasImage ? `${d.predictions[0].bytesBase64Encoded.length} base64 chars` : "no image data");
} catch (e) { console.error("   ❌ Imagen 3 failed:", e.message); }

// ── 3. Veo 2 (video generation) ─────────────────────────────────────────────
console.log("\n3. Testing Veo 2 (video generation)...");
try {
  const r = await fetch(`${BASE}/models/veo-2.0-generate-001:generateVideo?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: "A woman smiles at the camera holding a skincare bottle, studio lighting, close-up, cinematic",
      generateVideoConfig: { durationSeconds: 5, aspectRatio: "9:16", numberOfVideos: 1 },
    }),
  });
  const d = await r.json();
  if (!r.ok) {
    const code = d.error?.code ?? r.status;
    const msg = d.error?.message ?? JSON.stringify(d).slice(0, 200);
    if (code === 403) console.log("   ⚠️  Veo not enabled on this key/project yet (403):", msg);
    else if (code === 404) console.log("   ⚠️  Veo model not found on this key (404)");
    else console.error("   ❌ Veo error:", code, msg);
  } else {
    console.log("   ✅ Veo accessible! Operation:", d.name ?? JSON.stringify(d).slice(0, 100));
    console.log("   (Video will generate in background — full test in test-veo.mjs)");
  }
} catch (e) { console.error("   ❌ Veo failed:", e.message); }

console.log("\nDone.");
