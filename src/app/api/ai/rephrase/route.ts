import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateText } from "@/lib/ai";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
import { buildUserContext } from "@/lib/aiContext";
import { checkCredits, deductCredits, COSTS } from "@/lib/credits";
import { z } from "zod";

export const maxDuration = 30;

const bodySchema = z.object({
  text: z.string().min(1).max(2000),
  fieldType: z.enum(["headline", "body", "cta", "script", "imagePrompt", "generic"]).default("generic"),
  tone: z.enum(["punchy", "professional", "playful", "urgent", "empathetic"]).optional(),
  maxLength: z.number().min(10).max(2000).optional(),
  mode: z.enum(["rewrite", "generate"]).default("rewrite"),
});

const FIELD_GUIDELINES: Record<string, string> = {
  headline: "A high-converting ad headline. Max 80 chars. Must stop the scroll. No corporate language.",
  body: "Ad body copy. Max 200 chars. Lead with the #1 benefit. First-person, conversational.",
  cta: "Call-to-action. 2-5 words. Soft, friend-to-friend tone. NOT 'Buy now' or 'Order today'.",
  script: `A SHORT UGC video ad script spoken by a real person — NOT a brand brief.
STRICT RULES:
- Max 35 words for a 15s ad. Write ONLY that many words.
- Sound like a real person texting a friend, not a company announcement.
- NEVER include: hex color codes, URLs, website names, "Join thousands of...", "AI-powered", or any corporate language.
- Start with a hook (pattern interrupt, confession, or result-first).
- End with a soft CTA like "link in bio" or "try it free".
- Use fragments, fillers ("honestly", "like", "okay so"), specific numbers.
- Brand colors, logos, and technical details are VISUAL — they do NOT belong in spoken scripts.`,
  imagePrompt: "Detailed image prompt: lighting, mood, setting, camera angle, subject action. CRITICAL: NO TEXT, NO LOGOS, NO BUTTONS, NO UI ELEMENTS. Describe motion and environment only.",
  generic: "High-converting ad copy. Conversational, specific, no corporate language.",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`rephrase:${session.user.id}:${getClientKey(req)}`, 30, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const json = await req.json();
    const { text, fieldType, tone, maxLength, mode } = bodySchema.parse(json);

    // Get user's brand context and preferred language
    const [user, brandContext] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { language: true },
      }),
      buildUserContext(session.user.id)
    ]);

    // Check and deduct credits BEFORE generation
    const cost = COSTS.AI_TEXT_GEN;
    if (!(await checkCredits(session.user.id, cost))) {
      return NextResponse.json({ error: `Need ${cost} credit` }, { status: 402 });
    }

    const langNames: Record<string, string> = { en: "English", sw: "Swahili", yo: "Yoruba" };
    const userLang = user?.language ?? "en";
    const langName = langNames[userLang] ?? "English";
    const langInstruction = userLang !== "en" ? `\nIMPORTANT: Write in ${langName}.` : "";

    const guideline = FIELD_GUIDELINES[fieldType];

    // For scripts, strip color codes and URLs from brand context — they confuse the AI into saying them aloud
    const cleanedContext = fieldType === "script"
      ? brandContext.replace(/#[0-9A-Fa-f]{3,6}/g, "").replace(/https?:\/\/\S+/g, "").replace(/\.(com|app|io|co)\b/g, "")
      : brandContext;

    const systemPrompt = `You are an expert ad copywriter who writes for TikTok and Instagram Reels.
BRAND CONTEXT (use for tone/audience understanding only — never quote directly):
${cleanedContext}

TASK: ${guideline}
${tone ? `Tone: ${tone}.` : ""}
${maxLength ? `Hard limit: ${maxLength} chars.` : ""}
${langInstruction}

Return ONLY the final text. No labels, no quotes, no explanations.`;

    const prompt = mode === "generate"
      ? `Write a ${fieldType} for this brand/product.`
      : `Improve this ${fieldType} — keep the core idea but make it sound more natural and human:\n"${text}"`;

    await deductCredits(session.user.id, cost);

    let rewritten = await generateText({
      system: systemPrompt,
      prompt,
      maxTokens: 500,
    });

    if ((rewritten.startsWith('"') && rewritten.endsWith('"')) ||
        (rewritten.startsWith("'") && rewritten.endsWith("'"))) {
      rewritten = rewritten.slice(1, -1);
    }

    return NextResponse.json({ text: rewritten.trim() });
  } catch (err) {
    console.error("AI Rephrase error:", err);
    return NextResponse.json(
      { error: "AI currently busy or unavailable. Please try again in a moment." },
      { status: 500 },
    );
  }
}
