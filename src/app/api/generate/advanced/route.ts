import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateImage } from "@/lib/images";
import { checkCredits, deductCredits, COSTS } from "@/lib/credits";
import { platformsToString, imagesToString } from "@/lib/adHelpers";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { checkBrandKit } from "@/lib/brandCheck";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude";
import { z } from "zod";

export const maxDuration = 120;

const PlatformEnum = z.enum([
  "FACEBOOK", "INSTAGRAM", "TIKTOK", "YOUTUBE",
  "X_TWITTER", "LINKEDIN", "SNAPCHAT", "WHATSAPP", "PINTEREST",
]);

const bodySchema = z.object({
  type: z.enum(["IMAGE", "VIDEO", "CAROUSEL", "STORY"]).default("IMAGE"),
  platforms: z.array(PlatformEnum).min(1),
  headline: z.string().min(1).max(100),
  bodyText: z.string().max(500),
  callToAction: z.string().max(50),
  script: z.string().max(2000).optional(),
  scriptFramework: z.enum(["AIDA", "PAS", "BAB", "4U", "FAB"]).optional(),
  imagePrompt: z.string().max(1000).optional(),
  customImageUrl: z.string().url().optional(),
  musicGenre: z.string().max(50).optional(),
  aspectRatio: z.enum(["1:1", "9:16", "16:9", "4:5"]).default("1:1"),
  language: z.string().default("en"),
  scheduledAt: z.string().datetime().optional(),
  campaignId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const rl = rateLimit(`advanced:${userId}:${getClientKey(req)}`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Advanced Mode is a paid feature
  const userRow = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  const paidPlans = ["PRO", "BUSINESS", "ENTERPRISE"];
  if (!userRow || !paidPlans.includes(userRow.plan)) {
    return NextResponse.json(
      { error: "Advanced Mode is available on Pro and Business plans. Upgrade to unlock.", upgrade: true },
      { status: 402 },
    );
  }

  const brandCheck = await checkBrandKit(userId);
  if (!brandCheck.complete) {
    return NextResponse.json(
      { error: "Complete your Brand Kit first", missing: brandCheck.missing, redirect: "/settings/brand" },
      { status: 400 },
    );
  }

  const body = bodySchema.parse(await req.json());

  // 3 variants cost 3x credits
  const perAdCost = body.type === "VIDEO" ? COSTS.VIDEO_AD : COSTS.IMAGE_AD;
  const totalCost = perAdCost * 3;
  if (!(await checkCredits(userId, totalCost))) {
    return NextResponse.json({ error: `Insufficient credits (need ${totalCost})` }, { status: 402 });
  }

  // Generate 2 alternative variants using Claude (user's input is variant 1)
  let altVariants: { headline: string; bodyText: string; callToAction: string; imagePrompt: string }[] = [];
  try {
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: "You are an expert ad copywriter. Generate alternative ad copy variants. Return valid JSON only.",
      messages: [{
        role: "user",
        content: `Given this ad:
Headline: "${body.headline}"
Body: "${body.bodyText}"
CTA: "${body.callToAction}"

Generate 2 alternative versions with different angles/hooks. Return JSON:
[{"headline":"...","bodyText":"...","callToAction":"...","imagePrompt":"..."}]

Keep similar length. Make each variant meaningfully different.`,
      }],
    });
    const text = res.content.find((b) => b.type === "text");
    if (text && text.type === "text") {
      let raw = text.text.trim();
      if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      altVariants = JSON.parse(raw);
    }
  } catch { /* fall back to duplicating user's copy */ }

  // Build 3 variants: user's original + 2 AI alternatives
  const variants = [
    { headline: body.headline, bodyText: body.bodyText, callToAction: body.callToAction, imagePrompt: body.imagePrompt },
    ...(altVariants.length >= 2
      ? altVariants.slice(0, 2)
      : [
          { headline: body.headline, bodyText: body.bodyText, callToAction: body.callToAction, imagePrompt: body.imagePrompt },
          { headline: body.headline, bodyText: body.bodyText, callToAction: body.callToAction, imagePrompt: body.imagePrompt },
        ]
    ),
  ];

  await deductCredits(userId, totalCost);

  const platformStr = platformsToString(body.platforms);
  const ads = await Promise.all(
    variants.map(async (v, i) => {
      let imageUrl: string | null = i === 0 ? (body.customImageUrl ?? null) : null;
      const prompt = v.imagePrompt ?? body.imagePrompt;
      if (!imageUrl && prompt) {
        try {
          imageUrl = await generateImage({ prompt, aspectRatio: body.aspectRatio, quality: "high" });
        } catch { imageUrl = null; }
      }

      return prisma.ad.create({
        data: {
          userId,
          type: body.type,
          platform: platformStr,
          status: "READY",
          headline: v.headline,
          bodyText: v.bodyText,
          callToAction: v.callToAction,
          script: body.script,
          scriptFramework: body.scriptFramework,
          images: imageUrl ? imagesToString([imageUrl]) : null,
          thumbnailUrl: imageUrl,
          musicGenre: body.musicGenre,
          aspectRatio: body.aspectRatio,
          language: body.language,
          scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
          campaignId: body.campaignId,
          score: i === 0 ? 85 : (80 - i * 5), // original scores highest
        },
      });
    }),
  );

  return NextResponse.json({ success: true, ads });
}
