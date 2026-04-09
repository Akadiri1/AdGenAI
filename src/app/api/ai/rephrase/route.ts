import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateText } from "@/lib/ai";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { prisma } from "@/lib/prisma";
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
  headline: "A high-converting ad headline. Max 80 chars. Must stop the scroll in 0.5 seconds. Use proven patterns: numbers, questions, bold claims, 'how to', 'why X beats Y'. Be SPECIFIC to the product — no generic headlines. Example of BAD: 'Discover amazing products'. Example of GOOD: 'I replaced my $200/month tool with this $9 app'.",
  body: "Ad body copy. Max 300 chars for feed. Lead with the #1 benefit (not feature). Use short sentences. One idea per sentence. End with a reason to act NOW. Make it feel conversational, not corporate.",
  cta: "Call-to-action that creates motion. 2-5 words. Must feel like a recommendation, not a demand. Good: 'Try it free today', 'Get yours before they sell out', 'See why 10K people switched'. Bad: 'Buy now', 'Click here', 'Submit'.",
  script: "Video ad script for 15-30 seconds (~60-80 words). CRITICAL: Write as SPOKEN WORD — how a real person talks on camera. Include natural pauses ('...'), filler words ('honestly', 'look', 'like'), and genuine emotion. First sentence must be a pattern interrupt that makes people stop scrolling. Last sentence must be a CTA that sounds like a friend's recommendation, not a sales pitch.",
  imagePrompt: "Detailed image-generation prompt. ALWAYS include: (1) main subject + their action, (2) setting/environment, (3) lighting (golden hour, studio, natural), (4) mood/emotion, (5) camera angle (close-up, wide, over-shoulder), (6) style (photorealistic commercial photography, 8K). If brand colors given, specify: 'warm tones with [color] accents'. Show products IN USE, not isolated. Show RESULTS, not process.",
  generic: "Ad copy that converts. Be specific, emotional, and actionable. Every word must earn its place.",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`rephrase:${session.user.id}:${getClientKey(req)}`, 30, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { text, fieldType, tone, maxLength, mode } = bodySchema.parse(await req.json());

  // Get user's preferred language
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { language: true },
  });
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

  const contentPolicy = `
CONTENT POLICY (strict):
- NEVER produce hate speech, discriminatory language, slurs, or derogatory content about any group
- NEVER create misleading health claims, fake testimonials, or deceptive financial promises
- NEVER include explicit sexual content, extreme violence, or content targeting minors
- NEVER violate platform ad policies: no clickbait, no "YOU WON" scams, no fake urgency with countdown timers
- If the user's input contains any of the above, REFUSE by returning: "Content violates advertising policies. Please revise your input."
- Content must comply with Meta, TikTok, Google, and LinkedIn advertising standards`;

  const systemPrompt = mode === "generate"
    ? `You are the world's best performance ad copywriter. You've generated $500M+ in tracked revenue from paid social ads. You write copy that stops thumbs, triggers emotions, and drives clicks.

Field context: ${guideline}
${toneInstruction}
${lengthInstruction}
${langInstruction}
${contentPolicy}

RULES:
- Return ONLY the text. No explanations. No quotes around it. No prefixes like "Here's...".
- Be ruthlessly specific — generic copy is worthless. Reference the actual product/business.
- Write like a human, not a brand. Short sentences. Fragments are fine. Real emotion.
- If it's a headline: it MUST stop the scroll. Use a proven hook pattern (question, number, bold claim, story opener, "POV:").
- If it's a CTA: make the reader feel like they'd be MISSING OUT by not clicking.
- If it's body text: first sentence = strongest benefit. Last sentence = reason to act now.
- If it's a script: write SPOKEN WORD. Include pauses, filler ("honestly", "look"), personality. NOT a press release read aloud.
- If it's an image prompt: be absurdly detailed. Subject, action, setting, lighting, angle, mood, style, colors. Minimum 40 words.
- NEVER write something you've seen in a template. Every output must feel original and specific.`
    : `You are the world's best performance ad copywriter. Take the user's rough draft and make it significantly more compelling, clear, and conversion-focused — while keeping their core meaning.

Field context: ${guideline}
${toneInstruction}
${lengthInstruction}
${langInstruction}
${contentPolicy}

RULES:
- Return ONLY the rewritten text. No explanations. No quotes.
- Keep their core message but make it 10x more compelling.
- Sharpen the hook — if the first words don't grab attention, change them.
- Replace vague language with specific, concrete details.
- Make it sound like a human talking, not a corporation announcing.
- Tighten every sentence — cut words that don't add meaning.
- Respect character limits strictly.`;

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

    return NextResponse.json({ text: rewritten });
  } catch (err) {
    return NextResponse.json(
      { error: "AI rephrase failed", details: (err as Error).message },
      { status: 500 },
    );
  }
}
