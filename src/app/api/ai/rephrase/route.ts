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
  headline: "A high-converting ad headline. Max 80 chars. Must stop the scroll.",
  body: "Ad body copy. Max 300 chars. Lead with the #1 benefit. Conversational.",
  cta: "Call-to-action. 2-5 words. Action-oriented.",
  script: "Video ad script. Write as spoken word with pauses and personality.",
  imagePrompt: "Detailed image prompt including lighting, mood, and setting. CRITICAL: NO TEXT, NO LOGOS, NO BUTTONS, NO UI ELEMENTS. Focus ONLY on cinematic action, environment, and subject.",
  generic: "High-converting ad copy.",
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

    const systemPrompt = `You are an expert ad copywriter.
BRAND CONTEXT:
${brandContext}
Field context: ${guideline}
${tone ? `Tone: ${tone}.` : ""}
${maxLength ? `Limit: ${maxLength} chars.` : ""}
${langInstruction}
Return ONLY the text. No explanations.`;

    const prompt = mode === "generate" ? `Write this: ${text}` : `Rewrite this: "${text}"`;

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
