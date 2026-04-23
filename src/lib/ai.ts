/**
 * AI provider abstraction — supports Groq (free), Gemini (free), and Claude (premium).
 * Priority: GROQ_API_KEY → GEMINI_API_KEY → ANTHROPIC_API_KEY → error
 */

export type AIProvider = "groq" | "gemini" | "claude";

export function getActiveProvider(): AIProvider {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== "") return "groq";
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "") return "gemini";
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim() !== "") return "claude";
  throw new Error("No AI provider configured. Set GROQ_API_KEY (free), GEMINI_API_KEY (free), or ANTHROPIC_API_KEY in .env");
}

export async function generateText(params: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const provider = getActiveProvider();

  if (provider === "groq") return generateWithGroq(params);
  if (provider === "gemini") return generateWithGemini(params);
  return generateWithClaude(params);
}

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
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.prompt },
      ],
      max_tokens: params.maxTokens ?? 4096,
      temperature: 0.9,
      top_p: 0.95,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No text in Groq response");
  return text.trim();
}

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
      generationConfig: {
        maxOutputTokens: params.maxTokens ?? 4096,
        temperature: 0.9,
        topP: 0.95,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No text in Gemini response");
  return text.trim();
}

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
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }
  return textBlock.text.trim();
}
