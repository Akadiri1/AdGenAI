import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { platformsToString } from "@/lib/adHelpers";

/**
 * Creates a new ad from a template. The ad is in DRAFT status
 * so the user can edit it in Studio before publishing.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  // If premium, check if user has purchased it
  if (template.isPremium && template.price) {
    const hasPurchased = await prisma.transaction.findFirst({
      where: {
        userId: session.user.id,
        type: "template_purchase",
        providerId: template.id,
        status: "completed",
      },
    });
    if (!hasPurchased && template.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Purchase this template first" }, { status: 402 });
    }
  }

  let config: Record<string, unknown> = {};
  try {
    config = JSON.parse(template.config);
  } catch { /* */ }

  const ad = await prisma.ad.create({
    data: {
      userId: session.user.id,
      type: template.adType,
      platform: template.platform,
      status: "DRAFT",
      headline: (config.headline as string) ?? null,
      bodyText: (config.bodyText as string) ?? null,
      callToAction: (config.callToAction as string) ?? null,
      script: (config.script as string) ?? null,
      scriptFramework: (config.scriptFramework as string) ?? null,
      musicGenre: (config.musicGenre as string) ?? null,
      aspectRatio: (config.aspectRatio as string) ?? "1:1",
      images: (config.images as string) ?? null,
      thumbnailUrl: template.thumbnailUrl,
    },
  });

  // Increment template usage
  await prisma.template.update({
    where: { id },
    data: { usageCount: { increment: 1 } },
  });

  return NextResponse.json({ success: true, adId: ad.id });
}
