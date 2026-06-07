/**
 * POST /api/ads/[id]/start-generation
 *
 * Confirm a DRAFT ad and start the real Replicate pipeline.
 * For each PENDING scene we composite (Nano Banana) and kick off Kling video.
 * Credits are deducted here — not at draft creation time.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  compositeActorWithProduct,
  generateKlingVideoClip,
  enhanceActorPhoto,
  isReplicateConfigured,
} from "@/lib/replicate";
import { generateQwenVideo, isQwenConfigured } from "@/lib/qwen";
import { stringToImages } from "@/lib/adHelpers";
import { checkCredits, deductCredits } from "@/lib/credits";

export const maxDuration = 300;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    if (!isReplicateConfigured() && !isQwenConfigured()) {
      return NextResponse.json({
        error: "Video generation isn't configured yet. Set REPLICATE_API_TOKEN or QWEN_API_KEY.",
      }, { status: 503 });
    }

    const ad = await prisma.ad.findUnique({
      where: { id },
      include: { actor: true, scenes: { orderBy: { sceneNumber: "asc" } } },
    });
    if (!ad || ad.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (ad.status !== "DRAFT") {
      return NextResponse.json({ error: "Ad is not a draft (already generating or done)" }, { status: 409 });
    }
    if (!ad.actor) return NextResponse.json({ error: "Ad has no actor — pick one before starting" }, { status: 400 });
    if (!ad.actor.imageUrl) return NextResponse.json({ error: "Actor is missing an image URL — re-select an actor" }, { status: 400 });

    const pendingScenes = ad.scenes.filter((s) => s.status === "PENDING");
    if (pendingScenes.length === 0) {
      return NextResponse.json({ error: "No scenes to generate" }, { status: 400 });
    }

    // Cost: total scene seconds + 3 credits compositing overhead per scene
    const totalSeconds = pendingScenes.reduce((sum, s) => sum + s.durationSeconds, 0);
    const cost = totalSeconds + pendingScenes.length * 3;
    if (!(await checkCredits(userId, cost))) {
      return NextResponse.json({
        error: `Need ${cost} credits to start. Top up first.`,
        neededCredits: cost,
      }, { status: 402 });
    }

    await deductCredits(userId, cost);
    await prisma.ad.update({ where: { id }, data: { status: "GENERATING" } });

    const productImages = stringToImages(ad.productImages);
    const aspectRatio = (ad.aspectRatio as "9:16" | "1:1" | "16:9") ?? "9:16";
    let actorImageUrl = ad.actor!.imageUrl;

    // ── Auto-enhance custom actor photos ────────────────────────────────────
    const isCustomActor = !ad.actor!.isStock && !!ad.actor!.userId;
    if (isCustomActor) {
      try {
        const enhanced = await enhanceActorPhoto(actorImageUrl);
        actorImageUrl = enhanced;
        await prisma.actor.update({
          where: { id: ad.actor!.id },
          data: { imageUrl: enhanced, thumbnailUrl: enhanced },
        });
      } catch (err) {
        console.warn("[start-gen] face enhancement failed, using original:", (err as Error).message);
      }
    }

    // ── Composite ONCE ──────────────────────────────────────────────────────
    let sharedCompositeUrl: string | undefined = actorImageUrl;
    if (productImages.length > 0) {
      try {
        const visualInstructions = ad.visualInstructions?.trim();
        const compositePrompt = visualInstructions
          ? `${visualInstructions} Photorealistic commercial photography, sharp focus, consistent outfit, no text overlays.`
          : "Person naturally holding and using the product. Photorealistic commercial photography, sharp focus, consistent outfit and setting, no text overlays.";

        sharedCompositeUrl = await compositeActorWithProduct({
          actorImageUrl,
          productImageUrls: productImages,
          prompt: compositePrompt,
        });
      } catch (err) {
        console.warn("[start-gen] composite failed, falling back:", (err as Error).message);
        // If using Qwen, set to undefined to trigger T2V (High Quality imagination).
        // If using Replicate, we MUST use actorImageUrl as fallback.
        if (isQwenConfigured()) {
           sharedCompositeUrl = undefined;
        } else {
           sharedCompositeUrl = actorImageUrl;
        }
      }
    }

    // ── Video generation per scene ──────────────────────────────────────────
    const videoProvider = isQwenConfigured() ? "qwen" : "replicate";

    for (const scene of pendingScenes) {
      try {
        if (videoProvider === "qwen") {
          const { taskId } = await generateQwenVideo({
            prompt: scene.prompt,
            imageUrl: sharedCompositeUrl,
            duration: scene.durationSeconds <= 5 ? (5 as any) : (10 as any),
            aspectRatio,
          });

          await prisma.scene.update({
            where: { id: scene.id },
            data: {
              status: "GENERATING_VIDEO",
              compositeImageUrl: sharedCompositeUrl || null,
              klingTaskId: taskId,
            },
          });
        } else {
          const { predictionId } = await generateKlingVideoClip({
            imageUrl: sharedCompositeUrl || actorImageUrl,
            prompt: scene.prompt,
            durationSeconds: scene.durationSeconds <= 5 ? 5 : 10,
            aspectRatio,
          });

          await prisma.scene.update({
            where: { id: scene.id },
            data: {
              status: "GENERATING_VIDEO",
              compositeImageUrl: sharedCompositeUrl || actorImageUrl,
              klingTaskId: predictionId,
            },
          });
        }
      } catch (err) {
        await prisma.scene.update({
          where: { id: scene.id },
          data: {
            status: "FAILED",
            editInstructions: `Generation error: ${(err as Error).message}`,
          },
        });
      }
      if (videoProvider === "replicate" && pendingScenes.indexOf(scene) < pendingScenes.length - 1) {
        await new Promise((r) => setTimeout(r, 12000));
      }
    }

    return NextResponse.json({
      success: true,
      adId: ad.id,
      sceneCount: pendingScenes.length,
      creditsCharged: cost,
      message: "Generation started. Watch progress in Studio.",
    });
  } catch (err) {
    console.error("[start-generation] Critical Error:", err);
    return NextResponse.json({ error: "Critical server error", details: (err as Error).message }, { status: 500 });
  }
}
