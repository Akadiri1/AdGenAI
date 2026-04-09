import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateText } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { buildUserContext } from "@/lib/aiContext";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { UGC_TEMPLATES } from "@/lib/ugcTemplates";
import { z } from "zod";

export const maxDuration = 30;

const bodySchema = z.object({
  templateId: z.string(),
  productName: z.string().max(100).optional(),
  offer: z.string().max(200).optional(),
  additionalContext: z.string().max(500).optional(),
  tone: z.enum(["casual", "energetic", "professional", "funny", "emotional"]).default("casual"),
  language: z.string().default("en"),
});

const LANG_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German", pt: "Portuguese",
  hi: "Hindi", ar: "Arabic", ja: "Japanese", sw: "Swahili", yo: "Yoruba",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`ugc:${session.user.id}:${getClientKey(req)}`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = bodySchema.parse(await req.json());

  const template = UGC_TEMPLATES.find((t) => t.id === body.templateId);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const userContext = await buildUserContext(session.user.id);
  const langName = LANG_NAMES[body.language] ?? "English";

  const systemPrompt = `You are the world's best UGC ad scriptwriter. You've written scripts for campaigns that generated millions in revenue on TikTok, Instagram Reels, and YouTube Shorts.

YOUR STYLE:
- You write EXACTLY how real people talk on camera — not how copywriters write
- You nail the pacing: fast when excited, slow when making a point, pauses for emphasis
- You include the imperfections that make speech believable: "um", "like", "honestly", "I mean", "okay so", trailing off mid-thought and restarting
- You understand that the HOOK (first 1-3 seconds) determines if 95% of people keep watching or scroll away
- You know that authenticity > polish. A slightly messy, genuine recommendation converts 3x better than a scripted ad read
- You write for the EAR, not the eye. Short sentences. Fragments. Questions that make the viewer mentally respond.

PLATFORM PSYCHOLOGY:
- TikTok: raw, unfiltered, "I just discovered this" energy. Trending sounds reference. Gen Z language.
- Instagram Reels: slightly more polished but still personal. Aspirational but relatable.
- YouTube Shorts: informative + entertaining. "Did you know..." works well.
- Facebook: community-oriented, storytelling, slightly older demographic.

${body.language !== "en" ? `CRITICAL: Write the entire script in ${langName}. Use natural ${langName} speech patterns, not translated English.` : ""}

CONTENT POLICY: No hate speech, misleading claims, explicit content. Must comply with all platform ad policies.`;

  const userPrompt = `Write a UGC-style ad script that sounds indistinguishable from a real person filming themselves on their phone.

FORMAT: "${template.name}" — ${template.description}

TEMPLATE STRUCTURE (use as a loose guide, not rigid formula):
${template.scriptTemplate}

BRAND CONTEXT:
${userContext}
${body.productName ? `Product: ${body.productName}` : ""}
${body.offer ? `Current offer: ${body.offer}` : ""}
${body.additionalContext ? `Additional context: ${body.additionalContext}` : ""}

TONE: ${body.tone}
DURATION: ${template.duration}

CRITICAL REQUIREMENTS:
1. HOOK OR DIE: The first sentence must make someone stop scrolling IMMEDIATELY. No warm-ups. No "hey guys". Start with the most interesting/shocking/relatable thing.

2. SOUND LIKE A REAL HUMAN:
   - Include at least 2-3 natural speech markers: "honestly", "like", "um", "I mean", "okay so", "look"
   - Use sentence fragments: "Best purchase I've made. Period."
   - Include self-corrections: "It's like... no actually, it's more like..."
   - Add genuine reactions: "and I was like, wait what?"
   - Use trailing thoughts: "which is kind of insane when you think about it..."

3. BE SPECIFIC, NOT GENERIC:
   - BAD: "This product is amazing and changed my life"
   - GOOD: "I've tried like 6 different ones and this is the first one that actually [specific result]"

4. NATURAL CTA: End with a recommendation, not a sales pitch.
   - BAD: "Click the link in bio to purchase now!"
   - GOOD: "If you're dealing with [problem], just... try it. You'll see what I mean."

5. PACING: Read it out loud. If any part sounds "written", rewrite it.

6. WORD COUNT: ${template.duration === "15-25s" ? "50-70 words" : template.duration === "20-30s" ? "60-90 words" : template.duration === "20-35s" ? "70-100 words" : "80-130 words"}

Return ONLY the spoken words. No stage directions. No [brackets]. No explanations. Just what the person says on camera.`;

  try {
    let script = await generateText({
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 500,
    });
    if (script.startsWith('"') && script.endsWith('"')) script = script.slice(1, -1);

    return NextResponse.json({
      script,
      template: {
        id: template.id,
        name: template.name,
        format: template.format,
        duration: template.duration,
        hookStyle: template.hookStyle,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Script generation failed", details: (err as Error).message },
      { status: 500 },
    );
  }
}
