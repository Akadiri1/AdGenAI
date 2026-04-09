import { NextResponse } from "next/server";
import { generateText } from "@/lib/ai";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { z } from "zod";

export const maxDuration = 30;

const bodySchema = z.object({
  product: z.string().min(1).max(200),
  audience: z.string().max(200).optional(),
  styles: z.array(z.string()).min(1).max(8),
});

/**
 * Free hook generator — no auth required.
 * Rate limited by IP to prevent abuse.
 * This is a lead-gen tool: generates hooks → users sign up to create full ads.
 */
export async function POST(req: Request) {
  const rl = rateLimit(`hook:${getClientKey(req)}`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  if (!process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    // No AI provider configured — return sample hooks
    return NextResponse.json({
      hooks: [
        "Stop scrolling — this changes everything about how you create ads",
        "Most people waste thousands on ads. Here's a better way.",
        "I tested this for 30 days. The results shocked me.",
        "Your competitors already know this. Do you?",
        "What if you could create professional ads in 30 seconds?",
      ],
    });
  }

  const body = bodySchema.parse(await req.json());

  const styleInstructions = body.styles
    .map((s) => {
      const map: Record<string, string> = {
        question: "Question that makes them think",
        controversial: "Bold/controversial opinion",
        story: "Start of a personal story",
        statistic: "Surprising stat or fact",
        pain: "Hit a pain point they relate to",
        curiosity: "Curiosity gap — hint but don't reveal",
        "social-proof": "Social proof / numbers",
        urgency: "Create urgency or FOMO",
      };
      return map[s] ?? s;
    })
    .join(", ");

  try {
    const systemPrompt = `You are an expert ad copywriter specializing in hooks — the first line of an ad that stops people from scrolling. Return a JSON array of strings only. No explanation.

RULES:
- Each hook must be 1-2 sentences MAX
- Must grab attention in under 3 seconds when read aloud
- Must feel natural, not corporate
- NEVER use hate speech, misleading health claims, or clickbait scams
- Each hook should use a different angle`;

    const prompt = `Generate 8 scroll-stopping hooks for: "${body.product}"
${body.audience ? `Target audience: ${body.audience}` : ""}
Hook styles to use: ${styleInstructions}

Return JSON array of 8 hook strings. Each hook is 1-2 sentences. Different angle per hook.`;

    let raw = await generateText({ system: systemPrompt, prompt, maxTokens: 800 });
    if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    const hooks = JSON.parse(raw) as string[];
    return NextResponse.json({ hooks: hooks.slice(0, 8) });
  } catch (err) {
    return NextResponse.json(
      { error: "Generation failed", details: (err as Error).message },
      { status: 500 },
    );
  }
}
