import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { generateCampaign } from "@/lib/claude";
import { generateImage } from "@/lib/images";
import { checkCredits, deductCredits, COSTS } from "@/lib/credits";
import { platformsToString, imagesToString } from "@/lib/adHelpers";
import { buildUserContext } from "@/lib/aiContext";
import { checkBrandKit } from "@/lib/brandCheck";
import { rateLimit } from "@/lib/rateLimit";
import { z } from "zod";

export const maxDuration = 120;

const bodySchema = z.object({
  businessInput: z.string().min(3).max(500),
  platforms: z.array(z.string()).min(1).default(["INSTAGRAM"]),
  numVariants: z.number().min(1).max(5).default(3),
  language: z.string().default("en"),
  generateImages: z.boolean().default(true),
});

/**
 * Public API — create ads programmatically.
 * Auth: Bearer token (API key from /api/api-keys)
 * Rate limit: 20 requests/minute per key
 */
export async function POST(req: Request) {
  const auth = await validateApiKey(req);
  if (!auth) {
    return NextResponse.json(
      { error: "Invalid or missing API key. Use: Authorization: Bearer adg_your_key" },
      { status: 401 },
    );
  }

  const rl = rateLimit(`api:${auth.keyId}`, 20, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = bodySchema.parse(await req.json());

  const brandCheck = await checkBrandKit(auth.userId);
  if (!brandCheck.complete) {
    return NextResponse.json({ error: "Brand Kit incomplete", missing: brandCheck.missing }, { status: 400 });
  }

  const cost = COSTS.MAGIC_CAMPAIGN;
  if (!(await checkCredits(auth.userId, cost))) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  const userContext = await buildUserContext(auth.userId);
  const userRow = await prisma.user.findUnique({ where: { id: auth.userId }, select: { plan: true } });
  const quality: "standard" | "high" = userRow && ["PRO", "BUSINESS", "ENTERPRISE"].includes(userRow.plan) ? "high" : "standard";

  let campaign;
  try {
    campaign = await generateCampaign({
      businessInput: body.businessInput,
      platforms: body.platforms.map((p) => p.toLowerCase()),
      country: "US",
      language: body.language,
      numVariants: body.numVariants,
      userContext,
    });
  } catch (err) {
    return NextResponse.json({ error: "AI generation failed", details: (err as Error).message }, { status: 500 });
  }

  await deductCredits(auth.userId, cost);

  const ads = await Promise.all(
    campaign.ads.map(async (variant) => {
      let imageUrl: string | null = null;
      if (body.generateImages) {
        try {
          imageUrl = await generateImage({
            prompt: variant.image_prompt,
            aspectRatio: "1:1",
            quality,
          });
        } catch { imageUrl = null; }
      }

      return prisma.ad.create({
        data: {
          userId: auth.userId,
          type: "IMAGE",
          platform: platformsToString(body.platforms),
          status: "READY",
          headline: variant.headline,
          bodyText: variant.body_text,
          callToAction: variant.call_to_action,
          script: variant.video_script,
          scriptFramework: variant.script_framework,
          images: imageUrl ? imagesToString([imageUrl]) : null,
          thumbnailUrl: imageUrl,
          musicGenre: variant.recommended_music_genre,
          aspectRatio: "1:1",
          language: body.language,
          score: variant.predicted_score,
        },
      });
    }),
  );

  return NextResponse.json({
    success: true,
    campaign: {
      business_analysis: campaign.business_analysis,
      recommended_posting_times: campaign.recommended_posting_times,
      campaign_strategy: campaign.campaign_strategy,
    },
    ads: ads.map((ad) => ({
      id: ad.id,
      headline: ad.headline,
      bodyText: ad.bodyText,
      callToAction: ad.callToAction,
      thumbnailUrl: ad.thumbnailUrl,
      score: ad.score,
      status: ad.status,
    })),
  });
}

// List ads
export async function GET(req: Request) {
  const auth = await validateApiKey(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 50);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  const ads = await prisma.ad.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    select: {
      id: true, type: true, status: true, headline: true, bodyText: true,
      callToAction: true, thumbnailUrl: true, videoUrl: true, score: true,
      platform: true, aspectRatio: true, impressions: true, clicks: true,
      conversions: true, spend: true, revenue: true, createdAt: true,
    },
  });

  return NextResponse.json({ ads, count: ads.length, offset });
}
