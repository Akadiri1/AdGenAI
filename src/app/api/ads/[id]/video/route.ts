/**
 * POST /api/ads/[id]/video
 *
 * Legacy single-video endpoint (kept for old image-based ads).
 * The new ecommerce flow uses /api/generate/ecommerce + /api/ads/[id]/scenes
 * which generates real video via Kling on Replicate. No more FFmpeg slideshows.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stringToImages } from "@/lib/adHelpers";
import { uploadToStorage } from "@/lib/storage";
import { generateKlingVideoClip, getKlingClipStatus, isReplicateConfigured } from "@/lib/replicate";
import { checkCredits, deductCredits, addCredits } from "@/lib/credits";
import { z } from "zod";

export const maxDuration = 300;

const bodySchema = z.object({
  duration: z.enum(["5s", "10s"]).default("5s"),
}).optional();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad || ad.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isReplicateConfigured()) {
    return NextResponse.json({
      error: "Video generation not configured. Set REPLICATE_API_TOKEN.",
    }, { status: 503 });
  }

  let body: { duration: "5s" | "10s" } = { duration: "5s" };
  try {
    const parsed = bodySchema.parse(await req.json());
    if (parsed) body = parsed;
  } catch { /* defaults */ }

  const durationSeconds = body.duration === "10s" ? 10 : 5;
  const cost = durationSeconds + 2;
  if (!(await checkCredits(userId, cost))) {
    return NextResponse.json({ error: `Need ${cost} credits` }, { status: 402 });
  }

  const images = stringToImages(ad.images);
  if (images.length === 0) {
    return NextResponse.json({ error: "No source image. Upload one or use Create flow." }, { status: 400 });
  }

  await deductCredits(userId, cost);

  const prompt = ad.visualInstructions
    || (ad.headline ? `Cinematic commercial advertisement: ${ad.headline}. Professional, photorealistic, smooth camera motion.` : "Cinematic commercial advertisement, photorealistic, smooth camera motion.");

  try {
    const { predictionId } = await generateKlingVideoClip({
      imageUrl: images[0],
      prompt,
      durationSeconds,
      aspectRatio: (ad.aspectRatio as "9:16" | "16:9" | "1:1") || "9:16",
    });

    // Poll until ready
    let videoUrl: string | undefined;
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const status = await getKlingClipStatus(predictionId);
      if (status.status === "succeeded" && status.videoUrl) {
        videoUrl = status.videoUrl;
        break;
      }
      if (status.status === "failed") {
        throw new Error(status.error ?? "Kling generation failed");
      }
    }
    if (!videoUrl) throw new Error("Video generation timed out");

    // Persist to our storage
    const buf = await fetch(videoUrl).then((r) => r.arrayBuffer());
    const permanentUrl = await uploadToStorage({
      bytes: Buffer.from(buf),
      contentType: "video/mp4",
      extension: "mp4",
      folder: "ads/videos",
    });

    await prisma.ad.update({
      where: { id },
      data: { videoUrl: permanentUrl, type: "VIDEO", duration: durationSeconds },
    });

    return NextResponse.json({ success: true, videoUrl: permanentUrl, duration: durationSeconds });
  } catch (err) {
    await addCredits(userId, cost);
    return NextResponse.json({
      error: "Video generation failed",
      details: (err as Error).message,
    }, { status: 500 });
  }
}
