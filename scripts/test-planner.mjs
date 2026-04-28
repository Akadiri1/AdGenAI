import "dotenv/config";

// Direct test using the ai.ts abstraction (Groq)
const key = process.env.GROQ_API_KEY;
if (!key) { console.error("No GROQ_API_KEY"); process.exit(1); }

const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

const systemPrompt = `You are a UGC ad script director. Split the script below into scenes for a 15-second ad (2 scenes, ~7s each).
Output JSON only, no fences.`;

const userPrompt = `SCRIPT: "I was paying someone to make my ads and they were terrible. Then I found Famousli. I made a professional video ad in one minute. Same quality. No agency needed. Link in bio."

Return:
{
  "headline": "short headline",
  "bodyText": "caption",
  "callToAction": "soft CTA",
  "hashtags": ["tag1"],
  "fullScript": "full script verbatim",
  "scenes": [
    {
      "sceneNumber": 1,
      "durationSeconds": 7,
      "spokenLine": "...",
      "visualPrompt": "...",
      "shotType": "medium shot",
      "emotion": "genuine"
    }
  ],
  "musicGenre": "upbeat acoustic",
  "musicMood": "warm",
  "predictedScore": 78,
  "scoreReasoning": "..."
}`;

const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 2000,
    temperature: 0.9,
  }),
});

const data = await res.json();
if (!res.ok) {
  console.error("Groq error:", data);
  process.exit(1);
}

const text = data.choices?.[0]?.message?.content ?? "";
console.log("RAW RESPONSE:\n", text.slice(0, 1000));

// Try parse
try {
  const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  JSON.parse(clean);
  console.log("\n✅ JSON parses successfully");
} catch (e) {
  console.error("\n❌ JSON parse failed:", e.message);
}
