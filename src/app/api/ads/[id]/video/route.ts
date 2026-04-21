import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assembleVideo, type AspectRatio } from "@/lib/video";
import { stringToImages, imagesToString } from "@/lib/adHelpers";
import { uploadToStorage } from "@/lib/storage";
import { generateImage } from "@/lib/images";
import { getDuration } from "@/lib/videoDurations";
import { getMusicUrlForGenre } from "@/lib/music";
import { z } from "zod";
import fs from "fs";

export const maxDuration = 300;

const bodySchema = z.object({
  duration: z.enum(["6s", "15s", "30s", "60s"]).default("15s"),
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

  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad || ad.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { duration: string } = { duration: "15s" };
  try {
    const parsed = bodySchema.parse(await req.json());
    if (parsed) body = parsed;
  } catch { /* use defaults */ }

  const preset = getDuration(body.duration);
  let images = stringToImages(ad.images);

  if (images.length === 0) {
    return NextResponse.json({ error: "No source images on this ad" }, { status: 400 });
  }

  // If we need more images than we have, generate additional ones
  if (images.length < preset.imagesNeeded) {
    const needed = preset.imagesNeeded - images.length;
    const basePrompt = ad.headline
      ? `Professional ad photo for "${ad.headline}", different angle/scene, high quality commercial photography`
      : "Professional advertisement photo, different angle, high quality";

    const newImages = await Promise.all(
      Array.from({ length: needed }, async (_, i) => {
        try {
          return await generateImage({
            prompt: `${basePrompt}, variation ${i + 1}, unique composition`,
            aspectRatio: (ad.aspectRatio as "1:1" | "9:16" | "16:9" | "4:5") ?? "9:16",
            quality: "standard",
          });
        } catch {
          return null;
        }
      }),
    );

    const validNew = newImages.filter(Boolean) as string[];
    images = [...images, ...validNew];

    // Save the new images to the ad
    if (validNew.length > 0) {
      await prisma.ad.update({
        where: { id },
        data: { images: imagesToString(images) },
      });
    }
  }

  // If still not enough, repeat existing images to fill
  while (images.length < preset.imagesNeeded) {
    images.push(images[images.length % images.length]);
  }

  try {
    // Timeout video assembly at 120 seconds
    const videoPromise = assembleVideo({
      imageUrls: images.slice(0, preset.imagesNeeded),
      headline: ad.headline ?? undefined,
      callToAction: ad.callToAction ?? undefined,
      aspectRatio: (ad.aspectRatio as AspectRatio) ?? "9:16",
      durationPerImage: preset.durationPerImage,
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Video assembly timed out after 120 seconds")), 120000),
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

    await prisma.ad.update({
      where: { id },
      data: {
        videoUrl,
        type: "VIDEO",
        duration: preset.seconds,
      },
    });

    return NextResponse.json({ success: true, videoUrl, duration: preset.seconds });
  } catch (err) {
    return NextResponse.json(
      { error: "Video assembly failed", details: (err as Error).message },
      { status: 500 },
    );
  }
}
tatus: 500 },
    );
  }
}
