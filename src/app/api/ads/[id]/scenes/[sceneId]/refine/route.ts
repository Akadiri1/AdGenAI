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

    // Step 2: re-composite
    const productImages = stringToImages(ad.productImages);
    let newCompositeUrl: string | undefined = undefined;
    
    try {
      newCompositeUrl = await compositeActorWithProduct({
        actorImageUrl: ad.actor.imageUrl,
        productImageUrls: productImages,
        prompt: `${refined.visualPrompt}. Photorealistic commercial photography, sharp focus, no text overlays.`,
      });
    } catch (err) {
      // Graceful Fallback: If composite fails (e.g. Replicate out of credits), 
      // we'll try to use the actor image directly or skip it to trigger Text-to-Video in Qwen.
      console.warn("[refine] Composite failed, falling back:", (err as Error).message);
      
      // If we are using Qwen, we can set newCompositeUrl to undefined 
      // so generateQwenVideo uses Text-to-Video (T2V) which is very powerful.
      // If using Replicate, we MUST have a start image for Kling I2V.
      if (!isQwenConfigured()) {
         newCompositeUrl = ad.actor.imageUrl;
      }
    }

    // Step 3: kick off new render (Qwen if configured, otherwise Kling/Replicate)
    let taskIdOrPredictionId: string;
    try {
      if (isQwenConfigured()) {
        const { taskId } = await generateQwenVideo({
          prompt: refined.visualPrompt,
          imageUrl: newCompositeUrl, // If undefined, triggers T2V
          duration: scene.durationSeconds <= 5 ? (5 as any) : (10 as any),
          aspectRatio: (ad.aspectRatio as any) ?? "9:16",
        });
        taskIdOrPredictionId = taskId;
      } else {
        const { predictionId } = await generateKlingVideoClip({
          imageUrl: newCompositeUrl || ad.actor.imageUrl,
          prompt: refined.visualPrompt,
          durationSeconds: scene.durationSeconds <= 5 ? 5 : 10,
          aspectRatio: (ad.aspectRatio as any) ?? "9:16",
        });
        taskIdOrPredictionId = predictionId;
      }
    } catch (err) {
      return NextResponse.json({ error: "Generation start failed", details: (err as Error).message }, { status: 400 });
    }

    // Update scene
    const updated = await prisma.scene.update({
      where: { id: sceneId },
      data: {
        prompt: refined.visualPrompt,
        compositeImageUrl: newCompositeUrl || null,
        klingTaskId: taskIdOrPredictionId,
        status: "GENERATING_VIDEO",
        videoClipUrl: null,
        editInstructions: instruction,
      },
    });

    return NextResponse.json({
      success: true,
      scene: {
        id: updated.id,
        status: updated.status,
        prompt: updated.prompt,
        compositeImageUrl: updated.compositeImageUrl,
      },
    });
  } catch (err) {
    console.error("[refine] Critical Error:", err);
    return NextResponse.json({ error: "Critical server error", details: (err as Error).message }, { status: 500 });
  }
}
