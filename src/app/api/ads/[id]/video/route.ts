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

// AI Video generation takes longer
export const maxDuration = 600;

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

  // === CASE 1: SILICONFLOW (Priority 1) ===
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

  // === CASE 2: FAL.AI / LUMA (Priority 2) ===
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

  // === CASE 3: KLING AI (Priority 3) ===
  if (isKlingConfigured() && (body.duration === "6s" || body.duration === "15s")) {
    try {
      const taskId = await generateKlingVideo({
        prompt,
        aspect_ratio: (ad.aspectRatio as "1:1" | "9:16" | "16:9") || "9:16",
        duration: body.duration === "15s" ? "10" : "5",
      });

      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 10000));
        const status = await getKlingTaskStatus(taskId);
        if (status.status === "succeeded" && status.videoUrl) {
          const videoRes = await fetch(status.videoUrl);
          const buf = await videoRes.arrayBuffer();
          const uploadedUrl = await uploadToStorage({
            bytes: Buffer.from(buf),
            contentType: "video/mp4",
            extension: "mp4",
            folder: "ads/videos",
          });
          await prisma.ad.update({ where: { id }, data: { videoUrl: uploadedUrl, type: "VIDEO", duration: preset.seconds } });
          await logApiHealth("kling", true);
          return NextResponse.json({ success: true, videoUrl: uploadedUrl, duration: preset.seconds });
        }
        if (status.status === "failed") throw new Error("Kling failed");
      }
    } catch (err) {
      await logApiHealth("kling", false, (err as Error).message);
    }
  }

  // === CASE 4: MAGIC API (Priority 4) ===
  if (isMagicConfigured() && (body.duration === "6s" || body.duration === "15s")) {
    try {
      const taskId = await generateMagicVideo({
        prompt,
        aspect_ratio: (ad.aspectRatio as "1:1" | "9:16" | "16:9") || "9:16",
        duration: body.duration === "15s" ? 10 : 5,
      });

      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 10000));
        const status = await getMagicTaskStatus(taskId);
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
          await logApiHealth("magic", true);
          return NextResponse.json({ success: true, videoUrl: uploadedUrl, duration: preset.seconds });
        }
        if (status.status === "failed") throw new Error("Magic failed");
      }
    } catch (err) {
      await logApiHealth("magic", false, (err as Error).message);
    }
  }

  // === CASE 5: ASSEMBLY (Fallback) ===
  let images = stringToImages(ad.images);

  // Auto-generate images if none exist (zero-waste workflow)
  if (images.length === 0 || images.length < preset.imagesNeeded) {
    const needed = Math.max(preset.imagesNeeded - images.length, 1);
    const basePrompt = ad.visualInstructions || 
                      (ad.headline ? `Professional ad photo for "${ad.headline}"` : "Professional cinematic ad photo");

    try {
      const newImages = await Promise.all(
        Array.from({ length: Math.min(needed, 10) }, async (_, i) => {
          return await generateImage({
            prompt: needed > 1 ? `${basePrompt} - variation ${i + 1}` : basePrompt,
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
      if (images.length === 0) {
        await addCredits(userId, cost);
        return NextResponse.json({ error: "Could not generate source scenes for this video." }, { status: 500 });
      }
    }
  }

  while (images.length < preset.imagesNeeded) {
    images.push(images[images.length % images.length]);
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
