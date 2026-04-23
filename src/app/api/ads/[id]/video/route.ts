import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assembleVideo, type AspectRatio } from "@/lib/video";
import { generateKlingVideo, getKlingTaskStatus, isKlingConfigured } from "@/lib/kling";
import { generateMagicVideo, getMagicTaskStatus, isMagicConfigured } from "@/lib/magic";
import { generateSiliconVideo, getSiliconTaskStatus, isSiliconFlowConfigured } from "@/lib/siliconflow";
import { generateFalVideo, getFalTaskStatus, isFalConfigured } from "@/lib/fal";
import { logApiHealth } from "@/lib/apiHealth";
import { stringToImages, imagesToString } from "@/lib/adHelpers";
import { uploadToStorage } from "@/lib/storage";
import { generateImage } from "@/lib/images";
import { getDuration } from "@/lib/videoDurations";
import { getMusicUrlForGenre } from "@/lib/music";
import { checkCredits, deductCredits, addCredits } from "@/lib/credits";
import { z } from "zod";
import fs from "fs";

export const maxDuration = 60;

const bodySchema = z.object({
  duration: z.enum(["6s", "15s", "30s", "60s", "3m"]).default("15s"),
}).optional();

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad || ad.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { duration: string } = { duration: "15s" };
  try {
    const parsed = bodySchema.parse(await req.json());
    if (parsed) body = parsed;
  } catch { /* use defaults */ }

  const preset = getDuration(body.duration);
  const cost = body.duration === "3m" ? 5 : 2;

  if (!(await checkCredits(userId, cost))) {
    return NextResponse.json({ error: `Insufficient credits. Need ${cost} for this video.` }, { status: 402 });
  }

  await deductCredits(userId, cost);

  const prompt = ad.visualInstructions || 
                (ad.headline ? `A professional cinematic advertisement for ${ad.headline}` : "A professional cinematic commercial");

  // === CASE 1: FAL.AI (Priority 1 - Tested Working) ===
  if (isFalConfigured() && (body.duration === "6s" || body.duration === "15s")) {
    try {
      const requestId = await generateFalVideo({
        prompt,
        aspect_ratio: (ad.aspectRatio as "1:1" | "9:16" | "16:9") || "9:16",
      });

      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 8000));
        const status = await getFalTaskStatus(requestId);
        if (status.status === "completed" && status.videoUrl) {
          const videoRes = await fetch(status.videoUrl);
          const buf = await videoRes.arrayBuffer();
          const uploadedUrl = await uploadToStorage({
            bytes: Buffer.from(buf),
            contentType: "video/mp4",
            extension: "mp4",
            folder: "ads/videos",
          });
          await prisma.ad.update({ where: { id }, data: { videoUrl: uploadedUrl, type: "VIDEO", duration: preset.seconds } });
          await logApiHealth("fal", true);
          return NextResponse.json({ success: true, videoUrl: uploadedUrl, duration: preset.seconds });
        }
        if (status.status === "failed") throw new Error("Fal failed");
      }
    } catch (err) {
      await logApiHealth("fal", false, (err as Error).message);
    }
  }

  // === CASE 2: SILICONFLOW (Priority 2) ===
  if (isSiliconFlowConfigured() && (body.duration === "6s" || body.duration === "15s")) {
    try {
      const taskId = await generateSiliconVideo({
        prompt,
        aspect_ratio: (ad.aspectRatio as "1:1" | "9:16" | "16:9") || "9:16",
      });

      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 8000));
        const status = await getSiliconTaskStatus(taskId);
        if (status.status === "completed" && status.videoUrl) {
          const videoRes = await fetch(status.videoUrl);
          const buf = await videoRes.arrayBuffer();
          const uploadedUrl = await uploadToStorage({
            bytes: Buffer.from(buf),
            contentType: "video/mp4",
            extension: "mp4",
            folder: "ads/videos",
          });
          await prisma.ad.update({ where: { id }, data: { videoUrl: uploadedUrl, type: "VIDEO", duration: preset.seconds } });
          await logApiHealth("siliconflow", true);
          return NextResponse.json({ success: true, videoUrl: uploadedUrl, duration: preset.seconds });
        }
        if (status.status === "failed") throw new Error("SiliconFlow failed");
      }
    } catch (err) {
      await logApiHealth("siliconflow", false, (err as Error).message);
    }
  }

  // === ASSEMBLY (Fallback) ===
  let images = stringToImages(ad.images);
  if (images.length === 0 || images.length < preset.imagesNeeded) {
    const needed = Math.max(preset.imagesNeeded - images.length, 1);
    try {
      const newImages = await Promise.all(
        Array.from({ length: Math.min(needed, 10) }, async (_, i) => {
          return await generateImage({
            prompt: ad.visualInstructions || ad.headline || "Professional cinematic ad photo",
            aspectRatio: (ad.aspectRatio as "1:1" | "9:16" | "16:9" | "4:5") ?? "9:16",
            quality: "standard",
          });
        })
      );
      const validNew = newImages.filter(Boolean) as string[];
      images = [...images, ...validNew];
      if (validNew.length > 0) {
        await prisma.ad.update({ where: { id }, data: { images: imagesToString(images) } });
      }
    } catch (err) {
      console.error("Auto-scene generation failed:", err);
    }
  }

  if (images.length === 0) {
    await addCredits(userId, cost);
    return NextResponse.json(
      {
        error: "Video generation failed",
        details: "No source images available. Add at least one image to this ad or configure image generation.",
      },
      { status: 500 },
    );
  }

  const sourceImages = [...images];
  while (images.length < preset.imagesNeeded) {
    images.push(sourceImages[images.length % sourceImages.length]);
  }

  try {
    const musicUrl = getMusicUrlForGenre(ad.musicGenre);
    const videoPromise = assembleVideo({
      imageUrls: images.slice(0, preset.imagesNeeded),
      musicUrl,
      headline: ad.headline ?? undefined,
      callToAction: ad.callToAction ?? undefined,
      aspectRatio: (ad.aspectRatio as AspectRatio) ?? "9:16",
      durationPerImage: preset.durationPerImage,
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Video assembly timed out")), 240000),
    );
    const videoPath = await Promise.race([videoPromise, timeoutPromise]);

    const buf = fs.readFileSync(videoPath);
    fs.unlinkSync(videoPath);
    const videoUrl = await uploadToStorage({
      bytes: buf,
      contentType: "video/mp4",
      extension: "mp4",
      folder: "ads/videos",
    });

    await prisma.ad.update({ where: { id }, data: { videoUrl, type: "VIDEO", duration: preset.seconds } });
    return NextResponse.json({ success: true, videoUrl, duration: preset.seconds });
  } catch (err) {
    await addCredits(userId, cost);
    return NextResponse.json({ error: "Video assembly failed", details: (err as Error).message }, { status: 500 });
  }
}
