/**
 * POST /api/ads/[id]/scenes/[sceneId]/refine
 *
 * Instruction-based scene editing.
 * User writes natural-language instruction ("make her smile more, brighter lighting").
 * Claude rewrites the visual prompt, we re-composite and re-generate the clip.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { refineScenePrompt } from "@/lib/ecommerceAdPlanner";
import { compositeActorWithProduct, generateKlingVideoClip } from "@/lib/replicate";
import { generateQwenVideo, isQwenConfigured } from "@/lib/qwen";
import { stringToImages } from "@/lib/adHelpers";
import { checkCredits, deductCredits } from "@/lib/credits";

export const maxDuration = 120;

const bodySchema = z.object({
  instruction: z.string().min(3).max(500),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; sceneId: string }> },
) {
  try {
    const { id, sceneId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { instruction } = bodySchema.parse(await req.json());

    const ad = await prisma.ad.findUnique({
      where: { id },
      include: { actor: true, scenes: { where: { id: sceneId } } },
    });
    if (!ad || ad.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const scene = ad.scenes[0];
    if (!scene) return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    if (!ad.actor) return NextResponse.json({ error: "Ad has no actor" }, { status: 400 });

    // ── Connectivity Check ──────────────────────────────────────────────────
    const { validateConnectivity } = await import("@/lib/brandCheck");
    const productImages = stringToImages(ad.productImages);
    const connError = validateConnectivity({
      actorImageUrl: ad.actor.imageUrl,
      productImageUrls: productImages,
    });
    if (connError) {
      return NextResponse.json({ error: connError }, { status: 400 });
    }

    // Cost: 1 scene re-render = scene duration in credits + 2 for composite
    const cost = scene.durationSeconds + 2;
    if (!(await checkCredits(session.user.id, cost))) {
      return NextResponse.json({ error: `Need ${cost} credits to refine` }, { status: 402 });
    }

    // Step 1: rewrite the prompt with AI
    const refined = await refineScenePrompt({
      originalPrompt: scene.basePrompt,
      spokenLine: scene.spokenLine ?? "",
      instruction,
      language: ad.language,
    });

    await deductCredits(session.user.id, cost);

    // Update scene to GENERATING immediately so UI reflects it
    const updated = await prisma.scene.update({
      where: { id: sceneId },
      data: {
        prompt: refined.visualPrompt,
        status: "GENERATING_VIDEO",
        videoClipUrl: null,
        editInstructions: instruction,
      },
    });

    const actorImageUrl = ad.actor.imageUrl;

    // Step 2: re-composite
    const productImages = stringToImages(ad.productImages);
    let newCompositeUrl: string | undefined = undefined;
    
    try {
      newCompositeUrl = await compositeActorWithProduct({
        actorImageUrl: actorImageUrl,
        productImageUrls: productImages,
        prompt: `${refined.visualPrompt}. Photorealistic commercial photography, sharp focus, no text overlays.`,
      });
    } catch (err) {
      console.warn("[refine] Composite failed, falling back:", (err as Error).message);
      if (!isQwenConfigured()) {
         newCompositeUrl = actorImageUrl;
      }
    }

    // Step 3: kick off new render
    let taskIdOrPredictionId: string;
    try {
      if (isQwenConfigured()) {
        const { taskId } = await generateQwenVideo({
          prompt: refined.visualPrompt,
          imageUrl: newCompositeUrl,
          duration: scene.durationSeconds <= 5 ? (5 as any) : (10 as any),
          aspectRatio: (ad.aspectRatio as any) ?? "9:16",
        });
        taskIdOrPredictionId = taskId;
      } else {
        const { predictionId } = await generateKlingVideoClip({
          imageUrl: newCompositeUrl || actorImageUrl,
          prompt: refined.visualPrompt,
          durationSeconds: scene.durationSeconds <= 5 ? 5 : 10,
          aspectRatio: (ad.aspectRatio as any) ?? "9:16",
        });
        taskIdOrPredictionId = predictionId;
      }

      await prisma.scene.update({
        where: { id: sceneId },
        data: {
          compositeImageUrl: newCompositeUrl || null,
          klingTaskId: taskIdOrPredictionId,
        },
      });
    } catch (err) {
      console.error(`[refine] Generation start failed for scene ${sceneId}:`, err);
      await prisma.scene.update({
        where: { id: sceneId },
        data: {
          status: "FAILED",
          editInstructions: `Generation error: ${(err as Error).message}`,
        },
      });
      // Refund credits since it failed to start
      await prisma.user.update({
        where: { id: session.user.id },
        data: { credits: { increment: cost } },
      });
    }

    return NextResponse.json({
      success: true,
      scene: {
        id: updated.id,
        status: "GENERATING_VIDEO",
        prompt: updated.prompt,
        compositeImageUrl: updated.compositeImageUrl,
      },
    });
  } catch (err) {
    console.error("[refine] Critical Error:", err);
    return NextResponse.json({ error: "Critical server error", details: (err as Error).message }, { status: 500 });
  }
}
