import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assembleVideo, type AspectRatio } from "@/lib/video";
import { checkCredits, deductCredits } from "@/lib/credits";
import { imagesToString, platformsToString } from "@/lib/adHelpers";
import { uploadToStorage } from "@/lib/storage";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude";
import { buildUserContext } from "@/lib/aiContext";
import { checkBrandKit } from "@/lib/brandCheck";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { z } from "zod";
import fs from "fs";

export const maxDuration = 60;

const slideSchema = z.object({
  imageUrl: z.string().url(),
  prompt: z.string().max(500),
  duration: z.number().min(2).max(10).default(5),
});

const bodySchema = z.object({
  slides: z.array(slideSchema).min(1).max(20),
  headline: z.string().max(80).optional(),
  callToAction: z.string().max(40).optional(),
  musicGenre: z.string().max(30).optional(),
  aspectRatio: z.enum(["1:1", "9:16", "16:9", "4:5"]).default("9:16"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const rl = rateLimit(`storyboard:${userId}:${getClientKey(req)}`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const brandCheck = await checkBrandKit(userId);
  if (!brandCheck.complete) {
    return NextResponse.json({ error: "Complete Brand Kit first", missing: brandCheck.missing }, { status: 400 });
  }

  const body = bodySchema.parse(await req.json());

  const cost = Math.max(1, Math.ceil(body.slides.length / 3));
  if (!(await checkCredits(userId, cost))) {
    return NextResponse.json({ error: `Need ${cost} credits` }, { status: 402 });
  }

  // If user provided prompts, use AI to enhance them into a cohesive script + better headline
  let enhancedHeadline = body.headline ?? "";
  let enhancedCTA = body.callToAction ?? "";
  let videoScript = "";

  const hasPrompts = body.slides.some((s) => s.prompt.trim());
  if (hasPrompts) {
    try {
      const userContext = await buildUserContext(userId);
      const slideDescriptions = body.slides
        .map((s, i) => `Scene ${i + 1} (${s.duration}s): ${s.prompt || "No description"}`)
        .join("\n");

      const res = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 800,
        system: "You are an expert video ad scriptwriter. Return valid JSON only.",
        messages: [{
          role: "user",
          content: `Given these storyboard scenes for a video ad:

${slideDescriptions}

Brand context:
${userContext}

${body.headline ? `User's headline: "${body.headline}"` : "No headline provided — write one."}
${body.callToAction ? `User's CTA: "${body.callToAction}"` : "No CTA provided — write one."}

Generate:
1. A polished headline (max 60 chars) that ties all scenes together
2. A compelling CTA (max 30 chars)
3. A voiceover script that narrates across all scenes naturally (spoken word, ${body.slides.reduce((s, sl) => s + sl.duration, 0)} seconds total)

Return JSON: {"headline":"...","cta":"...","script":"..."}`,
        }],
      });

      const text = res.content.find((b) => b.type === "text");
      if (text && text.type === "text") {
        let raw = text.text.trim();
        if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        const parsed = JSON.parse(raw);
        if (!body.headline && parsed.headline) enhancedHeadline = parsed.headline;
        if (!body.callToAction && parsed.cta) enhancedCTA = parsed.cta;
        if (parsed.script) videoScript = parsed.script;
      }
    } catch {
      // AI enhancement failed — continue with user's original inputs
    }
  }

  await deductCredits(userId, cost);

  // Assemble the video
  try {
    const videoPath = await assembleVideo({
      imageUrls: body.slides.map((s) => s.imageUrl),
      headline: enhancedHeadline || undefined,
      callToAction: enhancedCTA || undefined,
      aspectRatio: body.aspectRatio as AspectRatio,
      durationPerImage: body.slides.length > 0
        ? Math.round(body.slides.reduce((s, sl) => s + sl.duration, 0) / body.slides.length)
        : 5,
    });

    const buf = fs.readFileSync(videoPath);
    fs.unlinkSync(videoPath);
    const videoUrl = await uploadToStorage({
      bytes: buf,
      contentType: "video/mp4",
      extension: "mp4",
      folder: "ads/videos",
    });

    // Create the ad record
    const ad = await prisma.ad.create({
      data: {
        userId,
        type: "VIDEO",
        platform: platformsToString(["INSTAGRAM", "TIKTOK", "YOUTUBE"]),
        status: "READY",
        headline: enhancedHeadline || null,
        bodyText: videoScript || body.slides.map((s) => s.prompt).filter(Boolean).join(". ") || null,
        callToAction: enhancedCTA || null,
        script: videoScript || null,
        images: imagesToString(body.slides.map((s) => s.imageUrl)),
        thumbnailUrl: body.slides[0]?.imageUrl ?? null,
        videoUrl,
        musicGenre: body.musicGenre,
        aspectRatio: body.aspectRatio,
        duration: body.slides.reduce((s, sl) => s + sl.duration, 0),
      },
    });

    return NextResponse.json({ success: true, adId: ad.id, videoUrl });
  } catch (err) {
    return NextResponse.json(
      { error: "Video assembly failed", details: (err as Error).message },
      { status: 500 },
    );
  }
}
