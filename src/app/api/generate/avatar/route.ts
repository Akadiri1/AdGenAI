import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAvatarVideo, getVideoStatus, isHeyGenConfigured } from "@/lib/heygen";
import { generateTalkingActor, isReplicateConfigured } from "@/lib/sadtalker";
import { AVATAR_LIBRARY } from "@/lib/avatars";
import { checkCredits, deductCredits, addCredits, COSTS } from "@/lib/credits";
import { platformsToString } from "@/lib/adHelpers";
import { checkBrandKit } from "@/lib/brandCheck";
import { uploadToStorage } from "@/lib/storage";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { logAudit, getRequestContext } from "@/lib/audit";
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

  const cost = COSTS.TALKING_ACTOR;
  if (!(await checkCredits(userId, cost))) {
    return NextResponse.json({ error: "Insufficient credits", required: cost }, { status: 402 });
  }

  // Deduct credits BEFORE the API call (atomic — refund on failure)
  await deductCredits(userId, cost);

  let videoUrl: string | undefined;

  try {
    if (isHeyGenConfigured()) {
      // ── PREMIUM PATH: HeyGen ──────────────────────────────
      const result = await generateAvatarVideo({
        avatarId: body.avatarId,
        script: body.script,
        voiceId: body.voiceId,
        voiceSettings: body.voiceSettings,
        aspectRatio: body.aspectRatio,
        speechToSpeechAudioUrl: body.speechToSpeechAudioUrl,
      });
      videoUrl = result.videoUrl;
      if (!videoUrl && result.videoId) {
        for (let i = 0; i < 12; i++) {
          await new Promise((r) => setTimeout(r, 5000));
          const status = await getVideoStatus(result.videoId);
          if (status.status === "completed" && status.videoUrl) {
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
              videoUrl = status.videoUrl;
            }
            break;
          }
          if (status.status === "failed") {
            await addCredits(userId, cost); // refund
            return NextResponse.json({ error: "Avatar video generation failed" }, { status: 500 });
          }
        }
      }
    } else if (isReplicateConfigured()) {
      // ── SCRAPPY PATH: Sadtalker via Replicate ──────────────
      const actor = AVATAR_LIBRARY.find((a) => a.id === body.avatarId);
      if (!actor || !actor.thumbnailUrl) {
        await addCredits(userId, cost);
        return NextResponse.json({ error: "Selected actor has no source image" }, { status: 400 });
      }
      videoUrl = await generateTalkingActor({
        sourceImageUrl: actor.thumbnailUrl,
        script: body.script,
        voice: {
          speed: body.voiceSettings?.speed,
          presetVoice: actor.gender === "male" ? "male" : "female",
        },
      });
    } else {
      // No backend configured — refund and inform
      await addCredits(userId, cost);
      return NextResponse.json(
        { error: "Talking actor generation is not yet enabled. Set REPLICATE_API_TOKEN or HEYGEN_API_KEY." },
        { status: 503 },
      );
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

    await logAudit({
      userId,
      action: "ad_created",
      resource: ad.id,
      metadata: {
        kind: "talking_actor",
        backend: isHeyGenConfigured() ? "heygen" : "sadtalker",
        avatarId: body.avatarId,
        creditsSpent: cost,
      },
      ...getRequestContext(req),
    });

    return NextResponse.json({
      success: true,
      adId: ad.id,
      videoUrl,
      backend: isHeyGenConfigured() ? "heygen" : "sadtalker",
    });
  } catch (err) {
    // Refund credits on any uncaught failure
    await addCredits(userId, cost);
    return NextResponse.json(
      { error: "Talking actor generation failed", details: (err as Error).message },
      { status: 500 },
    );
  }
}
