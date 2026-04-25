import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateImage } from "@/lib/images";
import { imagesToString, stringToImages } from "@/lib/adHelpers";
import { logAudit, getRequestContext } from "@/lib/audit";
import { buildUserContext } from "@/lib/aiContext";
import { checkCredits, deductCredits } from "@/lib/credits";
import { z } from "zod";

const patchSchema = z.object({
  headline: z.string().max(100).optional(),
  bodyText: z.string().max(500).optional(),
  callToAction: z.string().max(50).optional(),
  script: z.string().max(2000).optional(),
  visualInstructions: z.string().max(1000).optional(),
  scriptFramework: z.enum(["AIDA", "PAS", "BAB", "4U", "FAB"]).optional(),
  musicGenre: z.string().max(50).optional(),
  aspectRatio: z.enum(["1:1", "9:16", "16:9", "4:5"]).optional(),
  regenerateImage: z.boolean().optional(),
  newImagePrompt: z.string().max(1000).optional(),
  numScenes: z.number().min(1).max(10).optional(),
  customImageUrl: z.string().url().optional(),
  // Ecommerce brief fields (only editable while DRAFT)
  productName: z.string().max(120).nullable().optional(),
  productOffer: z.string().max(200).nullable().optional(),
  productImageUrls: z.array(z.string().url()).max(20).optional(),
  actorId: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [ad, user, brandContext] = await Promise.all([
    prisma.ad.findUnique({ where: { id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
    buildUserContext(session.user.id),
  ]);

  if (!ad || ad.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Editing is a paid feature
  const paidPlans = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"];
  if (!user || !paidPlans.includes(user.plan)) {
    return NextResponse.json(
      { error: "Editing ads is a paid feature. Upgrade to Starter or higher.", upgrade: true },
      { status: 402 },
    );
  }

  if (ad.status === "POSTED" || ad.status === "POSTING") {
    return NextResponse.json(
      { error: "Cannot edit an ad that has already been posted" },
      { status: 400 },
    );
  }

  const body = patchSchema.parse(await req.json());

  let newImages: string[] = [];
  if (body.customImageUrl) {
    newImages = [body.customImageUrl];
  } else if (body.regenerateImage) {
    const count = body.numScenes ?? 1;
    if (!(await checkCredits(session.user.id, count))) {
      return NextResponse.json({ error: `Need ${count} credits to generate ${count} scenes.` }, { status: 402 });
    }
    await deductCredits(session.user.id, count);

    try {
      const promptBase = body.newImagePrompt || ad.visualInstructions || ad.bodyText || ad.headline || brandContext;
      let scenePrompts = [promptBase];

      if (count > 1) {
        const { generateText } = await import("@/lib/ai");
        const expansionRes = await generateText({
          system: `You are a film director and storyboard artist. Break down the user's creative direction into ${count} distinct, sequential, and visually diverse scenes for a video ad. 
          Return ONLY a JSON array of strings. Each string must be a detailed image-generation prompt for that specific scene.
          Maintain style consistency.`,
          prompt: `Expand this brief into ${count} unique scenes: "${promptBase}"\n\nBrand Context:\n${brandContext}`,
          maxTokens: 1000,
        });

        try {
          const jsonMatch = expansionRes.match(/\[[\s\S]*\]/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : expansionRes);
          if (Array.isArray(parsed)) scenePrompts = parsed.slice(0, count);
        } catch {
          scenePrompts = Array.from({ length: count }, (_, i) => `${promptBase} - Scene ${i + 1}`);
        }
      }

      const results = await Promise.all(
        scenePrompts.map(async (scenePrompt) => {
          return generateImage({
            prompt: scenePrompt,
            aspectRatio: (body.aspectRatio ?? ad.aspectRatio) as "1:1" | "9:16" | "16:9" | "4:5",
            quality: "high",
          });
        })
      );
      newImages = results;
    } catch (err) {
      return NextResponse.json(
        { error: "Image generation failed", details: (err as Error).message },
        { status: 500 },
      );
    }
  }

  const currentImages = stringToImages(ad.images);
  const updatedImages = [...newImages, ...currentImages].slice(0, 20);

  // Ecommerce brief fields — only allowed while ad is still a DRAFT
  const briefFieldsProvided =
    body.productName !== undefined ||
    body.productOffer !== undefined ||
    body.productImageUrls !== undefined ||
    body.actorId !== undefined;
  if (briefFieldsProvided && ad.status !== "DRAFT") {
    return NextResponse.json({
      error: "Brief fields (product / actor / images) can only be edited while the ad is a DRAFT",
    }, { status: 409 });
  }

  // If they're swapping the actor, validate access
  if (body.actorId) {
    const actorRow = await prisma.actor.findUnique({ where: { id: body.actorId } });
    if (!actorRow) return NextResponse.json({ error: "Actor not found" }, { status: 404 });
    if (!actorRow.isStock && actorRow.userId !== session.user.id) {
      return NextResponse.json({ error: "Actor not accessible" }, { status: 403 });
    }
  }

  const updated = await prisma.ad.update({
    where: { id },
    data: {
      headline: body.headline ?? undefined,
      bodyText: body.bodyText ?? undefined,
      callToAction: body.callToAction ?? undefined,
      script: body.script ?? undefined,
      visualInstructions: body.visualInstructions ?? undefined,
      scriptFramework: body.scriptFramework ?? undefined,
      musicGenre: body.musicGenre ?? undefined,
      aspectRatio: body.aspectRatio ?? undefined,
      productName: body.productName ?? undefined,
      productOffer: body.productOffer ?? undefined,
      ...(body.productImageUrls !== undefined && {
        productImages: body.productImageUrls.length > 0 ? imagesToString(body.productImageUrls) : null,
      }),
      ...(body.actorId !== undefined && { actorId: body.actorId }),
      ...(newImages.length > 0 && {
        images: imagesToString(updatedImages),
        thumbnailUrl: newImages[0],
        videoUrl: null,
      }),
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "ad_edited",
    resource: id,
    metadata: {
      regeneratedImages: newImages.length,
      changed: Object.keys(body).filter((k) => body[k as keyof typeof body] !== undefined),
    },
    ...getRequestContext(req),
  });

  return NextResponse.json({ 
    success: true, 
    ad: { ...updated, images: updatedImages },
    message: newImages.length > 1 ? `${newImages.length} scenes generated!` : "Changes saved"
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad || ad.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.ad.delete({ where: { id } });
  await logAudit({
    userId: session.user.id,
    action: "ad_deleted",
    resource: id,
    metadata: { headline: ad.headline },
    ...getRequestContext(req),
  });
  return NextResponse.json({ success: true });
}
