/**
 * Test if your Gemini API key has access to Veo 2 video generation.
 * Run: node scripts/test-veo.mjs
 *
 * Veo is async: we kick off a generation and poll until done.
 * This generates a tiny 5-second test clip (~$0.035 from your free credit).
 */
import "dotenv/config";

const key = process.env.GEMINI_API_KEY;
if (!key) { console.error("❌ GEMINI_API_KEY not set"); process.exit(1); }
console.log("Key prefix:", key.slice(0, 12) + "...");

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "veo-2.0-generate-001";

// Step 1: kick off generation
console.log("\nStarting Veo 2 generation...");
const res = await fetch(`${BASE}/models/${MODEL}:generateVideo?key=${key}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "A confident woman holds a skincare product and smiles at the camera, soft studio lighting, close-up shot, cinematic, no text",
    generateVideoConfig: {
      durationSeconds: 5,
      aspectRatio: "9:16",
      numberOfVideos: 1,
    },
  }),
});

const body = await res.text();
if (!res.ok) {
  console.error(`❌ Veo returned ${res.status}`);
  console.error(body);
  process.exit(1);
}

const op = JSON.parse(body);
console.log("✅ Generation started. Operation name:", op.name);

// Step 2: poll until done
const pollUrl = `${BASE}/${op.name}?key=${key}`;
let done = false;
let attempts = 0;

while (!done && attempts < 60) {
  await new Promise((r) => setTimeout(r, 10000)); // wait 10s between polls
  attempts++;
  const poll = await fetch(pollUrl);
  const data = await poll.json();
  console.log(`Poll ${attempts}: done=${data.done ?? false}`);
  if (data.done) {
    done = true;
    if (data.error) {
      console.error("❌ Generation failed:", JSON.stringify(data.error));
      process.exit(1);
    }
    const videos = data.response?.generatedSamples ?? data.response?.videos ?? [];
    if (videos.length > 0) {
      console.log("\n✅ Veo 2 works! Video URL:", videos[0].video?.uri ?? JSON.stringify(videos[0]));
    } else {
      console.log("Response shape:", JSON.stringify(data.response, null, 2));
    }
  }
}

if (!done) console.error("❌ Timed out after 10 minutes");
