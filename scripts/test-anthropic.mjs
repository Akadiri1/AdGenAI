import "dotenv/config";

const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  console.error("❌ ANTHROPIC_API_KEY not set");
  process.exit(1);
}
console.log("Key prefix:", key.slice(0, 12) + "..." + key.slice(-4));

const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": key,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 50,
    messages: [{ role: "user", content: "Reply with the single word: ok" }],
  }),
});

const body = await res.text();
console.log("Status:", res.status);
console.log(body);
