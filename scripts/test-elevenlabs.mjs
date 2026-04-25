// Verify ElevenLabs key works for TTS (the only permission we need).
// Run with: node scripts/test-elevenlabs.mjs
import "dotenv/config";

const key = process.env.ELEVENLABS_API_KEY;
if (!key) { console.error("❌ ELEVENLABS_API_KEY not set in .env"); process.exit(1); }
console.log("Key prefix:", key.slice(0, 7) + "..." + key.slice(-4));

// Sarah, the default female voice
const voiceId = "EXAVITQu4vr4xnSDxMaL";

const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
  method: "POST",
  headers: {
    "xi-api-key": key,
    "Content-Type": "application/json",
    Accept: "audio/mpeg",
  },
  body: JSON.stringify({
    text: "ok",
    model_id: "eleven_multilingual_v2",
    voice_settings: { stability: 0.5, similarity_boost: 0.75 },
  }),
});

if (!res.ok) {
  const errText = await res.text();
  console.error(`❌ ElevenLabs returned ${res.status}`);
  console.error(errText);
  process.exit(1);
}

const buf = await res.arrayBuffer();
console.log(`✅ ElevenLabs TTS works — got ${buf.byteLength} bytes of audio`);
console.log("(Used voice: Sarah, model: eleven_multilingual_v2)");
console.log("\nQuota usage will show in the ElevenLabs dashboard under Subscription.");
