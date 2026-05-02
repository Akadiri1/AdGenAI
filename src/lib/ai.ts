/**
 * AI provider abstraction.
 * Priority: NVIDIA → GROQ → GEMINI → ANTHROPIC
 *
 * NVIDIA NIM hosts Llama 3.3 70B, DeepSeek, and others via OpenAI-compatible API.
 * It's fast, has generous rate limits, and uses the same nvapi key for all models.
 */

export type AIProvider = "nvidia" | "groq" | "gemini" | "claude";

export function getActiveProvider(): AIProvider {
  if (process.env.NVIDIA_API_KEY?.trim()) return "nvidia";
  if (process.env.GROQ_API_KEY?.trim())  return "groq";
  if (process.env.GEMINI_API_KEY?.trim()) return "gemini";
  if (process.env.ANTHROPIC_API_KEY?.trim()) return "claude";
  throw new Error("No AI provider configured. Set NVIDIA_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY.");
}

export async function generateText(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const provider = getActiveProvider();
  if (provider === "nvidia")  return generateWithNvidia(params);
  if (provider === "groq")    return generateWithGroq(params);
  if (provider === "gemini")  return generateWithGemini(params);
  return generateWithClaude(params);
}

// ── NVIDIA NIM (OpenAI-compatible) ─────────────────────────────────────────
async function generateWithNvidia(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) throw new Error("NVIDIA_API_KEY not set");

  const model = process.env.NVIDIA_MODEL ?? "meta/llama-3.3-70b-instruct";

  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: params.system },
        { role: "user",   content: params.prompt },
      ],
      max_tokens: params.maxTokens ?? 4096,
      temperature: 0.9,
      top_p: 0.95,
      stream: false,
    }),
  });

  if (!res.ok) throw new Error(`NVIDIA API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No text in NVIDIA response");
  return text.trim();
}

// ── Groq ────────────────────────────────────────────────────────────────────
async function generateWithGroq(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set");
  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: params.system }, { role: "user", content: params.prompt }],
      max_tokens: params.maxTokens ?? 4096,
      temperature: 0.9,
      top_p: 0.95,
    }),
  });
  if (!res.ok) throw new Error(`Groq API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No text in Groq response");
  return text.trim();
}

// ── Gemini ──────────────────────────────────────────────────────────────────
async function generateWithGemini(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: params.system }] },
      contents: [{ role: "user", parts: [{ text: params.prompt }] }],
      generationConfig: { maxOutputTokens: params.maxTokens ?? 4096, temperature: 0.9, topP: 0.95 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No text in Gemini response");
  return text.trim();
}

// ── Claude ──────────────────────────────────────────────────────────────────
async function generateWithClaude(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const { anthropic, CLAUDE_MODEL } = await import("@/lib/claude");
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: params.maxTokens ?? 4096,
    system: params.system,
    messages: [{ role: "user", content: params.prompt }],
  });
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text response from Claude");
  return textBlock.text.trim();
}
