/**
 * Ecommerce / UGC ad generation — POST /api/generate/ecommerce
 *
 * Behavior:
 *   - PAID users always land in DRAFT mode: we plan + persist Ad/Scene rows but
 *     do NOT deduct credits or call Replicate. The user lands in /studio,
 *     reviews/edits, then hits "Confirm & Start Generation" to fire the pipeline.
 *   - FREE users get prompts only.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { canGenerateVideo, type PlanKey } from "@/lib/plans";
import {
  planEcommerceAd,
  splitCustomScriptIntoScenes,
  generatePromptsOnly,
} from "@/lib/ecommerceAdPlanner";
import { isReplicateConfigured } from "@/lib/replicate";
import { platformsToString, imagesToString } from "@/lib/adHelpers";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { AVATAR_LIBRARY } from "@/lib/avatars";

export const maxDuration = 120;

const bodySchema = z.object({
  productName: z.string().max(120).optional(),
  productOffer: z.string().max(200).optional(),
  productDescription: z.string().max(500).optional(),
  productImageUrls: z.array(z.string().url()).max(20).default([]),

  actorId: z.string().optional(),
  avatarLibraryId: z.string().optional(),
  customActorImageUrl: z.string().url().optional(),

  customScript: z.string().max(2000).optional(),
  visualInstructions: z.string().max(500).optional(),

  voiceSettings: z.object({
    speed: z.number().min(0.5).max(2).default(1),
    stability: z.number().min(0).max(1).default(0.5),
    similarity: z.number().min(0).max(1).default(0.5),
    styleExaggeration: z.number().min(0).max(1).default(0.3),
  }).optional(),

  platforms: z.array(z.string()).min(1).default(["INSTAGRAM"]),
  targetSeconds: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(30), z.literal(60)]).default(15),
  aspectRatio: z.enum(["9:16", "1:1", "16:9"]).default("9:16"),
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
        customScript: body.customScript,
        language: body.language,
        numScenes: Math.max(2, Math.round(body.targetSeconds / 6)),
      });

      const ad = await prisma.ad.create({
        data: {
          userId,
          type: "PROMPT",
          platform: platformsToString(body.platforms),
          status: "PROMPT_ONLY",
          headline: body.productName ?? "AI-generated ad",
          bodyText: plan.fullScript,
          callToAction: "Generate with AI",
          script: plan.fullScript,
          musicGenre: plan.musicGenre,
          aspectRatio: body.aspectRatio,
          language: body.language,
          productName: body.productName,
          productOffer: body.productOffer,
          productImages: body.productImageUrls.length > 0 ? imagesToString(body.productImageUrls) : null,
          score: 0,
        },
      });

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
  // PAID TIER: DRAFT mode — plan only, no credits, no Replicate
  // ============================================================
  if (!isReplicateConfigured()) {
    return NextResponse.json({
      error: "Video generation isn't configured yet. The owner needs to set REPLICATE_API_TOKEN.",
    }, { status: 503 });
  }

  // Resolve / persist actor — we always end up with a DB Actor row so the
  // start-generation + refine endpoints can read ad.actor.imageUrl.
  let actorRow;
  if (body.actorId) {
    actorRow = await prisma.actor.findUnique({ where: { id: body.actorId } });
    if (!actorRow) return NextResponse.json({ error: "Actor not found" }, { status: 404 });
    if (!actorRow.isStock && actorRow.userId !== userId) {
      return NextResponse.json({ error: "Actor not accessible" }, { status: 403 });
    }
  } else if (body.avatarLibraryId) {
    const libAvatar = AVATAR_LIBRARY.find((a) => a.id === body.avatarLibraryId);
    if (!libAvatar) return NextResponse.json({ error: "Library avatar not found" }, { status: 404 });

    // Resolve relative portrait paths (e.g. /actors/ava-001.png) to absolute URLs
    // so Replicate's servers can fetch them during compositing.
    const appUrl = (process.env.NEXTAUTH_URL ?? "https://famousli.vercel.app").replace(/\/$/, "");
    const absoluteImageUrl = libAvatar.thumbnailUrl.startsWith("/")
      ? `${appUrl}${libAvatar.thumbnailUrl}`
      : libAvatar.thumbnailUrl;

    actorRow = await prisma.actor.findFirst({
      where: { userId, name: libAvatar.name },
    });
    if (!actorRow) {
      actorRow = await prisma.actor.create({
        data: {
          userId,
          name: libAvatar.name,
          imageUrl: absoluteImageUrl,
          thumbnailUrl: absoluteImageUrl,
          gender: libAvatar.gender,
          ageRange: libAvatar.age,
          ethnicity: libAvatar.ethnicity,
          vibe: libAvatar.tags.slice(0, 2).join(", ") || "natural",
          setting: libAvatar.situation,
        },
      });
    } else if (actorRow.imageUrl.startsWith("/")) {
      // Fix existing rows that stored a relative URL
      actorRow = await prisma.actor.update({
        where: { id: actorRow.id },
        data: { imageUrl: absoluteImageUrl, thumbnailUrl: absoluteImageUrl },
      });
    }
  } else if (body.customActorImageUrl) {
    actorRow = await prisma.actor.create({
      data: {
        userId,
        name: "Your actor",
        imageUrl: body.customActorImageUrl,
        thumbnailUrl: body.customActorImageUrl,
        vibe: "natural, authentic",
        setting: "studio",
      },
    });
  } else {
    return NextResponse.json({ error: "Pick an actor (actorId, avatarLibraryId, or customActorImageUrl)" }, { status: 400 });
  }

  // Plan/split scenes
  let plan;
  try {
    if (body.customScript && body.customScript.trim()) {
      plan = await splitCustomScriptIntoScenes({
        script: body.customScript.trim(),
        productName: body.productName,
        productOffer: body.productOffer,
        productDescription: body.productDescription,
        productImageCount: body.productImageUrls.length,
        actorName: actorRow.name,
        actorVibe: actorRow.vibe ?? "natural",
        actorSetting: actorRow.setting ?? "studio",
        visualInstructions: body.visualInstructions,
        language: body.language,
        targetSeconds: body.targetSeconds,
      });
    } else {
      if (!body.productName) {
        return NextResponse.json({ error: "Either a script or a product name is required" }, { status: 400 });
      }
      plan = await planEcommerceAd({
        businessName: user.businessName ?? undefined,
        businessDescription: user.businessDescription ?? undefined,
        brandVoice: user.brandVoice ?? undefined,
        targetAudience: user.targetAudience ?? undefined,
        productName: body.productName,
        productOffer: body.productOffer,
        productDescription: body.productDescription,
        productImageCount: body.productImageUrls.length,
        actorName: actorRow.name,
        actorVibe: actorRow.vibe ?? "natural",
        actorSetting: actorRow.setting ?? "studio",
        language: body.language,
        targetSeconds: body.targetSeconds,
      });
    }
  } catch (err) {
    return NextResponse.json({ error: "AI planning failed", details: (err as Error).message }, { status: 500 });
  }

  // Persist Ad in DRAFT — user reviews + edits in Studio, then hits "Start Generation"
  const ad = await prisma.ad.create({
    data: {
      userId,
      type: "VIDEO",
      platform: platformsToString(body.platforms),
      status: "DRAFT",
      headline: plan.headline,
      bodyText: plan.bodyText,
      callToAction: plan.callToAction,
      script: plan.fullScript,
      musicGenre: plan.musicGenre,
      aspectRatio: body.aspectRatio,
      duration: body.targetSeconds,
      language: body.language,
      productName: body.productName,
      productOffer: body.productOffer,
      productImages: body.productImageUrls.length > 0 ? imagesToString(body.productImageUrls) : null,
      actorId: actorRow.id,
      visualInstructions: body.visualInstructions ?? null,
      voiceSettings: body.voiceSettings ? JSON.stringify(body.voiceSettings) : null,
      score: plan.predictedScore,
    },
  });

  for (const planScene of plan.scenes) {
    const finalPrompt = body.visualInstructions
      ? `${planScene.visualPrompt} ${body.visualInstructions}`
      : planScene.visualPrompt;
    await prisma.scene.create({
      data: {
        adId: ad.id,
        sceneNumber: planScene.sceneNumber,
        durationSeconds: planScene.durationSeconds,
        status: "PENDING",
        prompt: finalPrompt,
        basePrompt: planScene.visualPrompt,
        spokenLine: planScene.spokenLine,
      },
    });
  }

  return NextResponse.json({
    success: true,
    adId: ad.id,
    draft: true,
    plan: {
      headline: plan.headline,
      sceneCount: plan.scenes.length,
      predictedScore: plan.predictedScore,
    },
    message: "Draft created. Review and confirm in Studio to start generation.",
  });
}
