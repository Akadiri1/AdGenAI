/**
 * Manually kicks off TTS + Kling Lip Sync for any scenes missing finalClipUrl.
 * Run: node scripts/lipsync-missing-scenes.mjs
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const EL_KEY = process.env.ELEVENLABS_API_KEY;
if (!REPLICATE_TOKEN) { console.error("❌ REPLICATE_API_TOKEN missing"); process.exit(1); }

// Get the most recent ad with scenes missing finalClipUrl
const ad = await prisma.ad.findFirst({
  where: { status: "READY" },
  orderBy: { updatedAt: "desc" },
  include: {
    actor: true,
    scenes: { where: { status: "READY", finalClipUrl: null }, orderBy: { sceneNumber: "asc" } },
  },
});

if (!ad || ad.scenes.length === 0) {
  console.log("No scenes missing lip-sync");
  await prisma.$disconnect();
  process.exit(0);
}

console.log(`Ad: ${ad.id}`);
console.log(`Scenes missing lip-sync: ${ad.scenes.map(s => s.sceneNumber).join(", ")}`);

const gender = ad.actor?.gender ?? "female";
const klingVoiceId = gender === "male" ? "en_oversea_male1" : "en_commercial_lady_en_f-v1";

for (const scene of ad.scenes) {
  const text = (scene.spokenLine?.trim() || "").slice(0, 300);
  if (!text || !scene.videoClipUrl) {
    console.log(`  Scene ${scene.sceneNumber}: skipping (no text or video)`);
    continue;
  }

  console.log(`\n  Scene ${scene.sceneNumber}: "${text.slice(0, 60)}..."`);

  // 1. TTS via ElevenLabs (optional — falls back to Kling text mode)
  let audioUrl = null;
  if (EL_KEY) {
    try {
      const voiceId = gender === "male" ? "nPczCjzI2devNBz1zQrb" : "EXAVITQu4vr4xnSDxMaL";
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: { "xi-api-key": EL_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
      });
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        // Upload to a temp public URL by using a data URL hack — or just use text mode
        // For simplicity, skip audio upload and use Kling text mode
        console.log(`    TTS generated (${buf.length} bytes) — using Kling text mode for reliability`);
      }
    } catch (e) { console.warn("    TTS failed, using Kling text mode:", e.message); }
  }

  // 2. Kick off Kling Lip Sync with text mode
  const input = { video_url: scene.videoClipUrl, text, voice_id: klingVoiceId };
  const predRes = await fetch("https://api.replicate.com/v1/models/kwaivgi/kling-lip-sync/predictions", {
    method: "POST",
    headers: { Authorization: `Bearer ${REPLICATE_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  const pred = await predRes.json();
  if (!predRes.ok) {
    console.error(`    ❌ Failed: ${JSON.stringify(pred).slice(0, 200)}`);
    continue;
  }
  console.log(`    ✅ Started prediction: ${pred.id}`);
  await prisma.scene.update({ where: { id: scene.id }, data: { lipSyncTaskId: pred.id } });

  // Wait between scenes to avoid rate limiting
  if (ad.scenes.indexOf(scene) < ad.scenes.length - 1) {
    console.log("    Waiting 15s before next scene...");
    await new Promise(r => setTimeout(r, 15000));
  }
}

console.log("\nDone. Predictions started. Refresh Studio in 2-3 minutes to see results.");
await prisma.$disconnect();
