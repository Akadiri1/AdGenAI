import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateImage } from "@/lib/images";
import { checkCredits, deductCredits, COSTS } from "@/lib/credits";
import { platformsToString, imagesToString } from "@/lib/adHelpers";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude";
import { z } from "zod";

export const maxDuration = 120;

const bodySchema = z.object({
  sourceAdId: z.string(),
  numVariants: z.number().min(2).max(10).default(5),
  varyWhat: z.enum(["actors", "scripts", "both"]).default("both"),
});

/**
 * Mass variant generation — takes one winning ad and creates N variations.
 * Like Arcads' "apply to 11 actors" button.
 *
 * "actors" = same script, different image prompts (different looking people)
 * "scripts" = same angle, different wording (A/B test copy)
 * "both" = different scripts + different visuals
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`variants:${session.user.id}:${getClientKey(req)}`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const userId = session.user.id;
  const body = bodySchema.parse(await req.json());

  const sourceAd = await prisma.ad.findUnique({ where: { id: body.sourceAdId } });
  if (!sourceAd || sourceAd.userId !== userId) {
    return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  }

  const totalCost = body.numVariants * COSTS.IMAGE_AD;
  if (!(await checkCredits(userId, totalCost))) {
    return NextResponse.json({ error: `Need ${totalCost} credits for ${body.numVariants} variants` }, { status: 402 });
  }

  // Generate variant copy + image prompts via Claude
  let variants: { headline: string; bodyText: string; callToAction: string; imagePrompt: string }[] = [];

  try {
    const varyInstruction =
      body.varyWhat === "actors"
        ? "Keep the EXACT same headline, body text, and CTA. Only vary the image prompt to show different people/settings."
        : body.varyWhat === "scripts"
          ? "Keep similar image prompts but write meaningfully different headlines, body text, and CTAs — different hooks, angles, emotions."
          : "Vary BOTH the copy AND the image prompts. Each variant should feel like a different creator made it.";

    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: `You are an expert ad copywriter. You specialize in performance marketing and brand consistency. Return valid JSON only.

BRAND CONTEXT (Use this to ensure variants match the business and target audience):
${brandContext}`,
      messages: [{
        role: "user",
        content: `Given this winning ad:
Headline: "${sourceAd.headline}"
Body: "${sourceAd.bodyText}"
CTA: "${sourceAd.callToAction}"

Generate ${body.numVariants} variations. ${varyInstruction}

Return JSON array:
[{"headline":"...","bodyText":"...","callToAction":"...","imagePrompt":"detailed prompt for a different person/setting showing this product/brand"}]

Make each variant meaningfully different while staying 100% true to the BRAND CONTEXT above. Different hooks, angles, demographics, settings.`,
      }],
    });

    const text = res.content.find((b) => b.type === "text");
    if (text && text.type === "text") {
      let raw = text.text.trim();
      if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      variants = JSON.parse(raw);
    }
  } catch {
    // Fallback: duplicate the original
    variants = Array.from({ length: body.numVariants }, () => ({
      headline: sourceAd.headline ?? "",
      bodyText: sourceAd.bodyText ?? "",
      callToAction: sourceAd.callToAction ?? "",
      imagePrompt: `Professional ad photo, different person, different angle, advertising ${sourceAd.headline}`,
    }));
  }

  await deductCredits(userId, totalCost);

  const ads = await Promise.all(
    variants.slice(0, body.numVariants).map(async (v, i) => {
      let imageUrl: string | null = null;
      try {
        imageUrl = await generateImage({
          prompt: v.imagePrompt,
          aspectRatio: (sourceAd.aspectRatio as "1:1" | "9:16" | "16:9" | "4:5") ?? "9:16",
          quality: "high",
        });
      } catch { imageUrl = null; }

      return prisma.ad.create({
        data: {
          userId,
          type: sourceAd.type,
          platform: sourceAd.platform,
          status: "READY",
          headline: v.headline,
          bodyText: v.bodyText,
          callToAction: v.callToAction,
          script: sourceAd.script,
          scriptFramework: sourceAd.scriptFramework,
          images: imageUrl ? imagesToString([imageUrl]) : null,
          thumbnailUrl: imageUrl,
          musicGenre: sourceAd.musicGenre,
          aspectRatio: sourceAd.aspectRatio,
          language: sourceAd.language,
          score: Math.max(50, (sourceAd.score ?? 80) - (i * 3)),
        },
      });
    }),
  );

  return NextResponse.json({ success: true, ads });
}
