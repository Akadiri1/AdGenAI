import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateImage } from "@/lib/images";
import { imagesToString, stringToImages } from "@/lib/adHelpers";
import { logAudit, getRequestContext } from "@/lib/audit";
import { z } from "zod";

const patchSchema = z.object({
  headline: z.string().max(100).optional(),
  bodyText: z.string().max(500).optional(),
  callToAction: z.string().max(50).optional(),
  script: z.string().max(2000).optional(),
  scriptFramework: z.enum(["AIDA", "PAS", "BAB", "4U", "FAB"]).optional(),
  musicGenre: z.string().max(50).optional(),
  aspectRatio: z.enum(["1:1", "9:16", "16:9", "4:5"]).optional(),
  regenerateImage: z.boolean().optional(),
  newImagePrompt: z.string().max(1000).optional(),
  customImageUrl: z.string().url().optional(),
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

  const [ad, user] = await Promise.all([
    prisma.ad.findUnique({ where: { id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
  ]);
  if (!ad || ad.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Editing is a paid feature (Starter and above — Free users must upgrade)
  const paidPlans = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"];
  if (!user || !paidPlans.includes(user.plan)) {
    return NextResponse.json(
      { error: "Editing ads is a paid feature. Upgrade to Starter or higher.", upgrade: true },
      { status: 402 },
    );
  }

  // Don't allow edits after posting
  if (ad.status === "POSTED" || ad.status === "POSTING") {
    return NextResponse.json(
      { error: "Cannot edit an ad that has already been posted" },
      { status: 400 },
    );
  }

  const body = patchSchema.parse(await req.json());

  // Handle image regen / custom upload
  let newImageUrl: string | undefined;
  if (body.customImageUrl) {
    newImageUrl = body.customImageUrl;
  } else if (body.regenerateImage && body.newImagePrompt) {
    try {
      newImageUrl = await generateImage({
        prompt: body.newImagePrompt,
        aspectRatio: (body.aspectRatio ?? ad.aspectRatio) as "1:1" | "9:16" | "16:9" | "4:5",
        quality: "high", // editing is paid-only
      });
    } catch (err) {
      return NextResponse.json(
        { error: "Image generation failed", details: (err as Error).message },
        { status: 500 },
      );
    }
  }

  const updated = await prisma.ad.update({
    where: { id },
    data: {
      headline: body.headline ?? undefined,
      bodyText: body.bodyText ?? undefined,
      callToAction: body.callToAction ?? undefined,
      script: body.script ?? undefined,
      scriptFramework: body.scriptFramework ?? undefined,
      musicGenre: body.musicGenre ?? undefined,
      aspectRatio: body.aspectRatio ?? undefined,
      ...(newImageUrl && {
        images: imagesToString([newImageUrl, ...stringToImages(ad.images).slice(0, 4)]),
        thumbnailUrl: newImageUrl,
        videoUrl: null, // invalidate existing video when image changes
      }),
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "ad_edited",
    resource: id,
    metadata: {
      regeneratedImage: !!newImageUrl,
      changed: Object.keys(body).filter((k) => body[k as keyof typeof body] !== undefined),
    },
    ...getRequestContext(req),
  });

  return NextResponse.json({ success: true, ad: updated });
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
