/**
 * Test OpenRouter API key + list free models + check for video capabilities
 * Run: node scripts/test-openrouter.mjs
 */
import "dotenv/config";

const key = process.env.OPENROUTER_API_KEY;
if (!key) { console.error("❌ OPENROUTER_API_KEY not set in .env"); process.exit(1); }
console.log("Key prefix:", key.slice(0, 8) + "...\n");

// 1. Test text generation with a free model
console.log("1. Testing free text generation...");
try {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://famousli.vercel.app",
      "X-Title": "Famousli",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [{ role: "user", content: "Reply with exactly: ok" }],
      max_tokens: 10,
    }),
  });
  const d = await r.json();
  if (!r.ok) console.error("   ❌ Failed:", JSON.stringify(d).slice(0, 200));
  else console.log("   ✅ Llama 3.3 70B (free):", d.choices?.[0]?.message?.content?.trim());
} catch (e) { console.error("   ❌", e.message); }

// 2. Fetch all models and filter for video-related ones
console.log("\n2. Checking for video/image generation models...");
try {
  const r = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const { data: models } = await r.json();

  const videoModels = (models || []).filter(m =>
    m.id.toLowerCase().includes("video") ||
    m.id.toLowerCase().includes("kling") ||
    m.id.toLowerCase().includes("veo") ||
    m.id.toLowerCase().includes("runway") ||
    m.id.toLowerCase().includes("sora") ||
    m.id.toLowerCase().includes("gen-3") ||
    (m.description || "").toLowerCase().includes("video")
  );

  if (videoModels.length > 0) {
    console.log(`   ✅ Found ${videoModels.length} video model(s):`);
    videoModels.forEach(m => console.log(`   • ${m.id} — ${(m.description || "").slice(0, 80)}`));
  } else {
    console.log("   ℹ️  No video generation models found");
  }

  // Show free text models
  const freeModels = (models || []).filter(m => m.id.includes(":free")).slice(0, 8);
  console.log(`\n   Free text models available (${freeModels.length} shown):`);
  freeModels.forEach(m => console.log(`   • ${m.id}`));

  // Credits check
  console.log("\n3. Checking account credits...");
  const cr = await fetch("https://openrouter.ai/api/v1/auth/key", {
    headers: { Authorization: `Bearer ${key}` },
  });
  const crData = await cr.json();
  console.log("   Credits:", crData.data?.usage ?? crData.usage ?? JSON.stringify(crData).slice(0, 100));
} catch (e) { console.error("   ❌", e.message); }
