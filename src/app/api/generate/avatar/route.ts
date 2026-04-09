import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAvatarVideo, getVideoStatus, isHeyGenConfigured } from "@/lib/heygen";
import { checkCredits, deductCredits, COSTS } from "@/lib/credits";
import { platformsToString } from "@/lib/adHelpers";
import { checkBrandKit } from "@/lib/brandCheck";
import { uploadToStorage } from "@/lib/storage";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { z } from "zod";

export const maxDuration = 120;

const bodySchema = z.object({
  avatarId: z.string(),
  script: z.string().min(1).max(2000),
  voiceId: z.string().optional(),
  voiceSettings: z.object({
    speed: z.number().min(0.5).max(2.0),
    stability: z.number().min(0).max(1),
    similarity: z.number().min(0).max(1),
    styleExaggeration: z.number().min(0).max(1),
  }).optional(),
  aspectRatio: z.enum(["9:16", "1:1", "16:9"]).default("9:16"),
  speechToSpeechAudioUrl: z.string().url().optional(),
  headline: z.string().max(80).optional(),
  callToAction: z.string().max(40).optional(),
  platforms: z.array(z.string()).default(["INSTAGRAM", "TIKTOK"]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const rl = rateLimit(`avatar:${userId}:${getClientKey(req)}`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const brandCheck = await checkBrandKit(userId);
  if (!brandCheck.complete) {
    return NextResponse.json({ error: "Complete Brand Kit first", missing: brandCheck.missing }, { status: 400 });
  }

  const body = bodySchema.parse(await req.json());

  const cost = COSTS.VIDEO_AD;
  if (!(await checkCredits(userId, cost))) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  try {
    // Generate avatar video
    const result = await generateAvatarVideo({
      avatarId: body.avatarId,
      script: body.script,
      voiceId: body.voiceId,
      voiceSettings: body.voiceSettings,
      aspectRatio: body.aspectRatio,
      speechToSpeechAudioUrl: body.speechToSpeechAudioUrl,
    });

    await deductCredits(userId, cost);

    // Poll for completion (max 60 seconds)
    let videoUrl = result.videoUrl;
    if (!videoUrl && result.videoId) {
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const status = await getVideoStatus(result.videoId);
        if (status.status === "completed" && status.videoUrl) {
          // Rehost the video to our storage
          try {
            const videoRes = await fetch(status.videoUrl);
            const buf = await videoRes.arrayBuffer();
            videoUrl = await uploadToStorage({
              bytes: Buffer.from(buf),
              contentType: "video/mp4",
              extension: "mp4",
              folder: "ads/avatar-videos",
            });
          } catch {
            videoUrl = status.videoUrl; // fallback to HeyGen URL
          }
          break;
        }
        if (status.status === "failed") {
          return NextResponse.json({ error: "Avatar video generation failed" }, { status: 500 });
        }
      }
    }

    // Create ad record
    const ad = await prisma.ad.create({
      data: {
        userId,
        type: "VIDEO",
        platform: platformsToString(body.platforms),
        status: videoUrl ? "READY" : "GENERATING",
        headline: body.headline,
        bodyText: body.script,
        callToAction: body.callToAction,
        script: body.script,
        videoUrl,
        thumbnailUrl: videoUrl, // HeyGen provides a thumbnail from the first frame
        aspectRatio: body.aspectRatio,
      },
    });

    return NextResponse.json({
      success: true,
      adId: ad.id,
      videoUrl,
      heygenConfigured: isHeyGenConfigured(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Avatar generation failed", details: (err as Error).message },
      { status: 500 },
    );
  }
}
