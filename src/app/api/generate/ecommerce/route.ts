/**
 * Ecommerce ad generation — POST /api/generate/ecommerce
 *
 * Step 1: Plan the ad (Claude)
 * Step 2: Composite each scene's actor + product (Nano Banana via Replicate)
 * Step 3: Kick off Kling video generation per scene (returns prediction IDs)
 * Step 4: Persist Ad + Scene rows; client polls for video readiness
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { canGenerateVideo, type PlanKey } from "@/lib/plans";
import { planEcommerceAd, generatePromptsOnly } from "@/lib/ecommerceAdPlanner";
import { compositeActorWithProduct, generateKlingVideoClip, isReplicateConfigured } from "@/lib/replicate";
import { checkCredits, deductCredits } from "@/lib/credits";
import { platformsToString, imagesToString } from "@/lib/adHelpers";
import { rateLimit, getClientKey } from "@/lib/rateLimit";

export const maxDuration = 300;

const bodySchema = z.object({
  productName: z.string().min(1).max(120),
  productOffer: z.string().max(200).optional(),
  productImageUrls: z.array(z.string().url()).min(0).max(5),
  actorId: z.string(),
  platforms: z.array(z.string()).min(1).default(["INSTAGRAM"]),
  targetSeconds: z.union([z.literal(15), z.literal(30), z.literal(60)]).default(15),
  language: z.string().default("en"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const rl = rateLimit(`ecom:${userId}:${getClientKey(req)}`, 20, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid request", details: (err as Error).message }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true, credits: true,
      businessName: true, businessDescription: true, brandVoice: true, targetAudience: true,
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // ============================================================
  // FREE TIER: prompts only — no actor composite, no Kling video
  // ============================================================
  if (!canGenerateVideo(user.plan as PlanKey)) {
    try {
      const plan = await generatePromptsOnly({
        productName: body.productName,
        productOffer: body.productOffer,
        language: body.language,
        numScenes: Math.max(2, Math.round(body.targetSeconds / 6)),
      });

      // Free users get the prompts as a "draft" Ad row they can browse
      const ad = await prisma.ad.create({
        data: {
          userId,
          type: "PROMPT",
          platform: platformsToString(body.platforms),
          status: "PROMPT_ONLY",
          headline: body.productName,
          bodyText: plan.fullScript,
          callToAction: "Generate with AI",
          script: plan.fullScript,
          musicGenre: plan.musicGenre,
          aspectRatio: "9:16",
          language: body.language,
          productName: body.productName,
          productOffer: body.productOffer,
          productImages: body.productImageUrls.length > 0 ? imagesToString(body.productImageUrls) : null,
          score: 0,
        },
      });

      // Save scenes as rows so user can copy individual prompts
      for (const sc of plan.scenes) {
        await prisma.scene.create({
          data: {
            adId: ad.id,
            sceneNumber: sc.sceneNumber,
            durationSeconds: 5,
            status: "PROMPT_ONLY",
            prompt: sc.visualPrompt,
            basePrompt: sc.visualPrompt,
            spokenLine: sc.spokenLine,
          },
        });
      }

      return NextResponse.json({
        success: true,
        promptOnly: true,
        adId: ad.id,
        plan,
        message: "Prompts generated. Copy them to Kling, Veo, Sora, or any AI video tool. Upgrade to Starter to generate videos automatically.",
      });
    } catch (err) {
      return NextResponse.json({ error: "Prompt generation failed", details: (err as Error).message }, { status: 500 });
    }
  }

  // ============================================================
  // PAID TIER: full pipeline
  // ============================================================
  if (!isReplicateConfigured()) {
    return NextResponse.json({
      error: "Video generation isn't configured yet. The owner needs to set REPLICATE_API_TOKEN.",
    }, { status: 503 });
  }

  // Each second of video = 1 credit. Plus 3-credit "compositing" overhead per scene.
  const cost = body.targetSeconds + Math.round(body.targetSeconds / 6) * 3;
  if (!(await checkCredits(userId, cost))) {
    return NextResponse.json({
      error: `Need ${cost} credits for a ${body.targetSeconds}s ad. You have ${user.credits}.`,
      neededCredits: cost,
    }, { status: 402 });
  }

  // Validate actor exists and is accessible
  const actor = await prisma.actor.findUnique({ where: { id: body.actorId } });
  if (!actor) return NextResponse.json({ error: "Actor not found" }, { status: 404 });
  if (!actor.isStock && actor.userId !== userId) {
    return NextResponse.json({ error: "Actor not accessible" }, { status: 403 });
  }

  // Step 1: Plan the ad with Claude
  let plan;
  try {
    plan = await planEcommerceAd({
      businessName: user.businessName ?? undefined,
      businessDescription: user.businessDescription ?? undefined,
      brandVoice: user.brandVoice ?? undefined,
      targetAudience: user.targetAudience ?? undefined,
      productName: body.productName,
      productOffer: body.productOffer,
      productImageCount: body.productImageUrls.length,
      actorName: actor.name,
      actorVibe: actor.vibe ?? "natural",
      actorSetting: actor.setting ?? "studio",
      language: body.language,
      targetSeconds: body.targetSeconds,
    });
  } catch (err) {
    return NextResponse.json({ error: "AI planning failed", details: (err as Error).message }, { status: 500 });
  }

  // Deduct credits up front (refund on total failure below)
  await deductCredits(userId, cost);

  // Create Ad row immediately so the client can navigate to Studio while scenes generate
  const ad = await prisma.ad.create({
    data: {
      userId,
      type: "VIDEO",
      platform: platformsToString(body.platforms),
      status: "GENERATING",
      headline: plan.headline,
      bodyText: plan.bodyText,
      callToAction: plan.callToAction,
      script: plan.fullScript,
      musicGenre: plan.musicGenre,
      aspectRatio: "9:16",
      duration: body.targetSeconds,
      language: body.language,
      productName: body.productName,
      productOffer: body.productOffer,
      productImages: body.productImageUrls.length > 0 ? imagesToString(body.productImageUrls) : null,
      actorId: actor.id,
      score: plan.predictedScore,
    },
  });

  // Step 2 + 3: For each scene, composite then kick off Kling
  // We do this sequentially so a failure in scene 1 doesn't burn budget on the rest
  for (const planScene of plan.scenes) {
    try {
      // Composite the actor with the product into a still image
      const compositeUrl = await compositeActorWithProduct({
        actorImageUrl: actor.imageUrl,
        productImageUrls: body.productImageUrls,
        prompt: `${planScene.visualPrompt}. Photorealistic, commercial photography, sharp focus, no text overlays.`,
      });

      // Start Kling video generation (async — we just store the prediction ID)
      const { predictionId } = await generateKlingVideoClip({
        imageUrl: compositeUrl,
        prompt: planScene.visualPrompt,
        durationSeconds: planScene.durationSeconds <= 5 ? 5 : 10,
        aspectRatio: "9:16",
      });

      await prisma.scene.create({
        data: {
          adId: ad.id,
          sceneNumber: planScene.sceneNumber,
          durationSeconds: planScene.durationSeconds,
          status: "GENERATING_VIDEO",
          prompt: planScene.visualPrompt,
          basePrompt: planScene.visualPrompt,
          spokenLine: planScene.spokenLine,
          compositeImageUrl: compositeUrl,
          klingTaskId: predictionId,
        },
      });
    } catch (err) {
      // Record failure but keep going
      await prisma.scene.create({
        data: {
          adId: ad.id,
          sceneNumber: planScene.sceneNumber,
          durationSeconds: planScene.durationSeconds,
          status: "FAILED",
          prompt: planScene.visualPrompt,
          basePrompt: planScene.visualPrompt,
          spokenLine: planScene.spokenLine,
          editInstructions: `Generation error: ${(err as Error).message}`,
        },
      });
    }
  }

  return NextResponse.json({
    success: true,
    adId: ad.id,
    plan: {
      headline: plan.headline,
      sceneCount: plan.scenes.length,
      predictedScore: plan.predictedScore,
    },
    message: "Ad is generating. Watch progress in Studio.",
  });
}
