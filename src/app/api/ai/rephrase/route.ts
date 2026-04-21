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
  headline: "A high-converting ad headline. Max 80 chars. Must stop the scroll in 0.5 seconds. Use proven patterns: numbers, questions, bold claims, 'how to', 'why X beats Y'. Be SPECIFIC to the product — no generic headlines.",
  body: "Ad body copy. Max 300 chars for feed. Lead with the #1 benefit (not feature). Use short sentences. One idea per sentence. End with a reason to act NOW. Make it feel conversational, not corporate.",
  cta: "Call-to-action that creates motion. 2-5 words. Must feel like a recommendation, not a demand. Good: 'Try it free today', 'Get yours before they sell out'. Bad: 'Buy now', 'Click here'.",
  script: "Video ad script for 15-30 seconds (~60-80 words). CRITICAL: Write as SPOKEN WORD — how a real person talks on camera. Include natural pauses ('...'), filler words ('honestly', 'look', 'like'), and genuine emotion. First sentence must be a pattern interrupt that makes people stop scrolling.",
  imagePrompt: "Detailed image-generation prompt. ALWAYS include: (1) main subject + their action, (2) setting/environment, (3) lighting (golden hour, studio, natural), (4) mood/emotion, (5) camera angle, (6) style. If brand colors given, specify: 'warm tones with [color] accents'.",
  generic: "Ad copy that converts. Be specific, emotional, and actionable. Every word must earn its place.",
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

  const { text, fieldType, tone, maxLength, mode } = bodySchema.parse(await req.json());

  // Check and deduct credits for every AI text action
  const cost = COSTS.AI_TEXT_GEN;
  if (!(await checkCredits(session.user.id, cost))) {
    return NextResponse.json({ error: `Insufficient credits. This action costs ${cost} token.` }, { status: 402 });
  }
  await deductCredits(session.user.id, cost);

  // Get user's brand context and preferred language
  const [user, brandContext] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { language: true },
    }),
    buildUserContext(session.user.id)
  ]);

  const langNames: Record<string, string> = {
    en: "English", es: "Spanish", fr: "French", de: "German", pt: "Portuguese",
    it: "Italian", hi: "Hindi", ar: "Arabic", ja: "Japanese", zh: "Chinese",
    sw: "Swahili", yo: "Yoruba",
  };
  const userLang = user?.language ?? "en";
  const langName = langNames[userLang] ?? "English";
  const langInstruction = userLang !== "en"
    ? `\nIMPORTANT: Write the output in ${langName}, not English.`
    : "";

  const guideline = FIELD_GUIDELINES[fieldType];
  const toneInstruction = tone ? `Tone: ${tone}.` : "";
  const lengthInstruction = maxLength ? `Keep the output under ${maxLength} characters.` : "";

  const systemPrompt = mode === "generate"
    ? `You are the world's best performance ad copywriter. 

BRAND CONTEXT:
${brandContext}

Field context: ${guideline}
${toneInstruction}
${lengthInstruction}
${langInstruction}

RULES:
- Return ONLY the text. No explanations. No quotes.
- Be ruthlessly specific — generic copy is worthless.
- Write like a human, not a brand. Short sentences. Fragments are fine. Real emotion.
- Stay 100% consistent with the BRAND CONTEXT provided above.`
    : `You are the world's best performance ad copywriter. Take the user's rough draft and make it significantly more compelling while staying true to their brand.

BRAND CONTEXT (Maintain brand consistency):
${brandContext}

Field context: ${guideline}
${toneInstruction}
${lengthInstruction}
${langInstruction}

RULES:
- Return ONLY the rewritten text. No explanations. No quotes.
- Keep their core message but make it 10x more compelling.
- Sharpen the hook — grab attention immediately.
- Replace vague language with specific, concrete details.
- Stay 100% consistent with the BRAND CONTEXT provided above.`;

  try {
    const prompt = mode === "generate"
      ? `Write this for me: ${text}`
      : `Rewrite this: "${text}"`;

    let rewritten = await generateText({
      system: systemPrompt,
      prompt,
      maxTokens: 500,
    });

    // Strip surrounding quotes if present
    if ((rewritten.startsWith('"') && rewritten.endsWith('"')) ||
        (rewritten.startsWith("'") && rewritten.endsWith("'"))) {
      rewritten = rewritten.slice(1, -1);
    }

    return NextResponse.json({ text: rewritten.trim() });
  } catch (err) {
    return NextResponse.json(
      { error: "AI rephrase failed", details: (err as Error).message },
      { status: 500 },
    );
  }
}
