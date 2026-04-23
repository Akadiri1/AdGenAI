import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isHeyGenConfigured } from "@/lib/heygen";
import { isReplicateConfigured } from "@/lib/sadtalker";
import { isMagicConfigured } from "@/lib/magic";
import { checkCredits, deductCredits, addCredits, COSTS } from "@/lib/credits";
import { platformsToString, imagesToString } from "@/lib/adHelpers";
import { enqueueVideoGeneration } from "@/lib/queue";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { logAudit, getRequestContext } from "@/lib/audit";
import { z } from "zod";

export const maxDuration = 60;

const bodySchema = z.object({
  avatarId: z.string(),
  script: z.string().min(1).max(2000),
  voiceId: z.string().optional(),
  voiceSettings: z.object({
    speed: z.number().min(0.5).max(2.0),
    stability: z.number().min(0).max(1),
    similarity: z.number().min(0).max(1),
    styleExaggeration: z.number().min(0).max(1),
  }).optional(),
  aspectRatio: z.enum(["9:16", "1:1", "16:9"]).default("9:16"),
  speechToSpeechAudioUrl: z.string().url().optional(),
  productImages: z.array(z.string().url()).optional(),
  visualInstructions: z.string().max(1000).optional(),
  headline: z.string().max(80).optional(),
  callToAction: z.string().max(40).optional(),
  platforms: z.array(z.string()).default(["INSTAGRAM", "TIKTOK"]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const rl = rateLimit(`avatar:${userId}:${getClientKey(req)}`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const cost = COSTS.TALKING_ACTOR;
  if (!(await checkCredits(userId, cost))) {
    return NextResponse.json({ error: `Need ${cost} credits for a talking actor video` }, { status: 402 });
  }

  try {
    const body = bodySchema.parse(await req.json());
    await deductCredits(userId, cost);

    // 1. Create ad record in GENERATING state
    const ad = await prisma.ad.create({
      data: {
        userId,
        type: "VIDEO",
        platform: platformsToString(body.platforms),
        status: "GENERATING",
        headline: body.headline,
        bodyText: "Queued for generation...",
        callToAction: body.callToAction,
        script: body.script,
        images: body.productImages && body.productImages.length > 0 ? imagesToString(body.productImages) : null,
        visualInstructions: body.visualInstructions || null,
        aspectRatio: body.aspectRatio,
      },
    });

    // 2. Enqueue the heavy lifting (HeyGen + Visuals + FFmpeg)
    await enqueueVideoGeneration({
      adId: ad.id,
      userId,
      avatarId: body.avatarId,
      script: body.script,
      visualInstructions: body.visualInstructions,
      productImages: body.productImages,
      aspectRatio: body.aspectRatio,
    });

    await logAudit({
      userId,
      action: "ad_created",
      resource: ad.id,
      metadata: { kind: "talking_actor_queued", cost },
      ...getRequestContext(req),
    });

    return NextResponse.json({ adId: ad.id, status: "GENERATING" });

  } catch (err) {
    console.error("Avatar API error:", err);
    return NextResponse.json(
      { error: "Failed to queue video generation", details: (err as Error).message },
      { status: 500 },
    );
  }
}
