import "dotenv/config";

const key = process.env.NVIDIA_API_KEY;
if (!key) { console.error("❌ NVIDIA_API_KEY not set"); process.exit(1); }
console.log("Key prefix:", key.slice(0, 10) + "...");

// Test 1: Text generation
console.log("\n1. Testing Llama 3.3 70B text...");
const textRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "meta/llama-3.3-70b-instruct",
    messages: [{ role: "user", content: "Reply with exactly: ok" }],
    max_tokens: 10,
  }),
});
const textData = await textRes.json();
if (!textRes.ok) { console.error("   ❌ Text failed:", textData); }
else console.log("   ✅ Text works:", textData.choices?.[0]?.message?.content?.trim());

// Test 2: Image generation
console.log("\n2. Testing SDXL image...");
const imgRes = await fetch("https://ai.api.nvidia.com/v1/genai/stabilityai/sdxl-turbo", {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify({
    text_prompts: [{ text: "a red apple on a white table, product photography", weight: 1 }],
    sampler: "K_EULER_ANCESTRAL", steps: 10, cfg_scale: 7, width: 512, height: 512, seed: 0,
  }),
});
const imgText = await imgRes.text();
if (!imgRes.ok) { console.error("   ❌ Image failed:", imgRes.status, imgText.slice(0, 200)); }
else {
  const imgData = JSON.parse(imgText);
  const hasImage = !!imgData.artifacts?.[0]?.base64;
  console.log("   ✅ Image works — got", hasImage ? imgData.artifacts[0].base64.length + " base64 chars" : JSON.stringify(imgData).slice(0, 100));
}
