import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  adId: z.string(), // source ad to create template from
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string().min(1).max(50),
  isPublic: z.boolean().default(false),
  isPremium: z.boolean().default(false),
  price: z.number().min(0).max(999).optional(),
});

// Create a template from an existing ad
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = createSchema.parse(await req.json());

  // Verify the ad belongs to this user
  const ad = await prisma.ad.findUnique({ where: { id: body.adId } });
  if (!ad || ad.userId !== session.user.id) {
    return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  }

  const template = await prisma.template.create({
    data: {
      name: body.name,
      description: body.description,
      category: body.category.toLowerCase(),
      platform: ad.platform, // inherits platforms from ad
      adType: ad.type,
      thumbnailUrl: ad.thumbnailUrl,
      config: JSON.stringify({
        headline: ad.headline,
        bodyText: ad.bodyText,
        callToAction: ad.callToAction,
        script: ad.script,
        scriptFramework: ad.scriptFramework,
        musicGenre: ad.musicGenre,
        aspectRatio: ad.aspectRatio,
        images: ad.images,
      }),
      isPublic: body.isPublic,
      isPremium: body.isPremium,
      price: body.isPremium ? (body.price ?? 5) : null,
      creatorId: session.user.id,
    },
  });

  return NextResponse.json({ success: true, template });
}

// List templates (for marketplace)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const creatorId = url.searchParams.get("creator");

  const templates = await prisma.template.findMany({
    where: {
      isPublic: true,
      ...(category && category !== "All" && { category: category.toLowerCase() }),
      ...(creatorId && { creatorId }),
    },
    orderBy: [{ usageCount: "desc" }, { rating: "desc" }],
    take: 50,
    include: {
      creator: { select: { name: true, businessName: true } },
    },
  });

  return NextResponse.json({ templates });
}
