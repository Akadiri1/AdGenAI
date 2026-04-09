import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Export ad with white-label branding.
 * Business/Enterprise users get their logo applied.
 * Free/Starter get AdGenAI watermark.
 * Pro gets clean export (no watermark, no custom logo).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [ad, user] = await Promise.all([
    prisma.ad.findUnique({ where: { id } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, brandLogo: true, businessName: true },
    }),
  ]);

  if (!ad || ad.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const mediaUrl = ad.videoUrl ?? ad.thumbnailUrl;
  if (!mediaUrl) return NextResponse.json({ error: "No media" }, { status: 400 });

  const isWhiteLabel = ["BUSINESS", "ENTERPRISE"].includes(user?.plan ?? "FREE");
  const isPaid = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"].includes(user?.plan ?? "FREE");

  return NextResponse.json({
    url: mediaUrl,
    whiteLabel: isWhiteLabel,
    watermark: !isPaid ? "AdGenAI" : null,
    brandLogo: isWhiteLabel ? user?.brandLogo : null,
    brandName: isWhiteLabel ? user?.businessName : null,
    downloadable: true,
    format: ad.videoUrl ? "mp4" : "png",
  });
}
