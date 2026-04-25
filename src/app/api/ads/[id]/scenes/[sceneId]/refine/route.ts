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

  // Step 1: rewrite the prompt with Claude
  const refined = await refineScenePrompt({
    originalPrompt: scene.basePrompt,
    spokenLine: scene.spokenLine ?? "",
    instruction,
    language: ad.language,
  });

  await deductCredits(session.user.id, cost);

  // Step 2: re-composite (new prompt may need new actor pose / product placement)
  const productImages = stringToImages(ad.productImages);
  let newCompositeUrl: string;
  try {
    newCompositeUrl = await compositeActorWithProduct({
      actorImageUrl: ad.actor.imageUrl,
      productImageUrls: productImages,
      prompt: `${refined.visualPrompt}. Photorealistic commercial photography, sharp focus, no text overlays.`,
    });
  } catch (err) {
    return NextResponse.json({ error: "Composite failed", details: (err as Error).message }, { status: 500 });
  }

  // Step 3: kick off new Kling render
  const { predictionId } = await generateKlingVideoClip({
    imageUrl: newCompositeUrl,
    prompt: refined.visualPrompt,
    durationSeconds: scene.durationSeconds <= 5 ? 5 : 10,
    aspectRatio: "9:16",
  });

  // Update scene — new prompt, new composite, new task ID, status back to GENERATING
  const updated = await prisma.scene.update({
    where: { id: sceneId },
    data: {
      prompt: refined.visualPrompt,
      compositeImageUrl: newCompositeUrl,
      klingTaskId: predictionId,
      status: "GENERATING_VIDEO",
      videoClipUrl: null,
      editInstructions: instruction, // keep the latest instruction for display
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
}
