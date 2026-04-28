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
  isReplicateConfigured,
} from "@/lib/replicate";
import { stringToImages } from "@/lib/adHelpers";
import { checkCredits, deductCredits } from "@/lib/credits";

export const maxDuration = 300;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  if (!isReplicateConfigured()) {
    return NextResponse.json({
      error: "Video generation isn't configured yet. The owner needs to set REPLICATE_API_TOKEN.",
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
  const actorImageUrl = ad.actor!.imageUrl;

  // ── Composite ONCE ──────────────────────────────────────────────────────
  // Run Nano Banana a single time so every scene starts from the SAME image:
  // same face, same outfit, same setting. Only camera angle + action change.
  let sharedCompositeUrl = actorImageUrl;
  if (productImages.length > 0) {
    try {
      sharedCompositeUrl = await compositeActorWithProduct({
        actorImageUrl,
        productImageUrls: productImages,
        prompt: "Person holding and using the product naturally. Photorealistic commercial photography, sharp focus, consistent outfit and setting, no text overlays.",
      });
    } catch (err) {
      console.warn("[start-gen] composite failed, using actor image directly:", (err as Error).message);
    }
  }

  // ── Kling per scene (sequential, 3s gap) ───────────────────────────────
  // Each scene gets a different prompt (angle/action) but the SAME starting
  // image, ensuring outfit + setting consistency across all clips.
  for (const scene of pendingScenes) {
    try {
      const { predictionId } = await generateKlingVideoClip({
        imageUrl: sharedCompositeUrl,
        prompt: scene.prompt,
        durationSeconds: scene.durationSeconds <= 5 ? 5 : 10,
        aspectRatio,
      });

      await prisma.scene.update({
        where: { id: scene.id },
        data: {
          status: "GENERATING_VIDEO",
          compositeImageUrl: sharedCompositeUrl,
          klingTaskId: predictionId,
        },
      });
    } catch (err) {
      await prisma.scene.update({
        where: { id: scene.id },
        data: {
          status: "FAILED",
          editInstructions: `Generation error: ${(err as Error).message}`,
        },
      });
    }
    // 3s gap to stay inside Replicate's burst limit
    if (pendingScenes.indexOf(scene) < pendingScenes.length - 1) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  return NextResponse.json({
    success: true,
    adId: ad.id,
    sceneCount: pendingScenes.length,
    creditsCharged: cost,
    message: "Generation started. Watch progress in Studio.",
  });
}
