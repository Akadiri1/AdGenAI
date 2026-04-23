import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCampaign } from "@/lib/claude";
import { generateImage } from "@/lib/images";
import { checkCredits, deductCredits, COSTS } from "@/lib/credits";
import { platformsToString, imagesToString } from "@/lib/adHelpers";
import { buildUserContext } from "@/lib/aiContext";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { checkBrandKit } from "@/lib/brandCheck";
import { logAudit, getRequestContext } from "@/lib/audit";
import { z } from "zod";

export const maxDuration = 60;

const PlatformEnum = z.enum([
  "FACEBOOK", "INSTAGRAM", "TIKTOK", "YOUTUBE",
  "X_TWITTER", "LINKEDIN", "SNAPCHAT", "WHATSAPP", "PINTEREST",
]);

const bodySchema = z.object({
  businessInput: z.string().min(3).max(500),
  platforms: z.array(PlatformEnum).min(1),
  scheduledAt: z.string().datetime().optional(),
  postNow: z.boolean().optional(),
  generateImages: z.boolean().default(true),
  country: z.string().default("US"),
  language: z.string().default("en"),
  numVariants: z.number().min(1).max(5).default(1),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Rate limit: 10 generations per minute per user
  const rl = rateLimit(`magic:${userId}:${getClientKey(req)}`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  // Require Brand Kit before generating ads
  const brandCheck = await checkBrandKit(userId);
  if (!brandCheck.complete) {
    return NextResponse.json(
      {
        error: "Complete your Brand Kit first",
        missing: brandCheck.missing,
        redirect: "/settings/brand",
      },
      { status: 400 },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid request", details: (err as Error).message }, { status: 400 });
  }

  const cost = COSTS.MAGIC_CAMPAIGN;
  if (!(await checkCredits(userId, cost))) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  // Image quality: PRO+ users get ultra-high-quality model
  const userRow = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  // Starter+ gets high quality (1080p/4K). Free gets standard.
  const imageQuality: "standard" | "high" =
    userRow && ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"].includes(userRow.plan) ? "high" : "standard";

  // Build personalized context from user's brand + ad history
  const userContext = await buildUserContext(userId);

  // Generate campaign via Claude
  let campaign;
  try {
    campaign = await generateCampaign({
      businessInput: body.businessInput,
      platforms: body.platforms.map((p) => p.toLowerCase()),
      country: body.country,
      language: body.language,
      numVariants: body.numVariants,
      userContext,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "AI generation failed", details: (err as Error).message },
      { status: 500 },
    );
  }

  await deductCredits(userId, cost);

  // Persist ads (without images to return fast; images generated in parallel)
  const createdAds = await Promise.all(
    campaign.ads.map(async (variant) => {
      const primaryPlatform = body.platforms[0];
      const aspectRatio = variant.platform_specific?.[primaryPlatform.toLowerCase()]?.aspect_ratio ?? "1:1";

      let imageUrl: string | null = null;
      if (body.generateImages) {
        try {
          imageUrl = await generateImage({
            prompt: variant.image_prompt,
            aspectRatio: aspectRatio as "1:1" | "9:16" | "16:9" | "4:5",
            quality: imageQuality,
          });
        } catch {
          imageUrl = null;
        }
      }

      return prisma.ad.create({
        data: {
          userId,
          type: "VIDEO",
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
          aspectRatio,
          language: body.language,
          score: variant.predicted_score,
          scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        },
      });
    }),
  );

  for (const ad of createdAds) {
    await logAudit({
      userId,
      action: "ad_created",
      resource: ad.id,
      metadata: { type: ad.type, platforms: body.platforms, source: "magic" },
      ...getRequestContext(req),
    });
  }

  return NextResponse.json({
    success: true,
    campaign,
    ads: createdAds,
  });
}
