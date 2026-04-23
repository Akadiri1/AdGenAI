import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { scrapeWebsite } from "@/lib/scraper";
import { generateText } from "@/lib/ai";
import { checkCredits, deductCredits, COSTS } from "@/lib/credits";
import { prisma } from "@/lib/prisma";
import { imagesToString } from "@/lib/adHelpers";
import { generateImage } from "@/lib/images";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, description, image, aspectRatio = "9:16" } = await req.json();
  if (!url && !description) {
    return NextResponse.json({ error: "URL or Product Description is required" }, { status: 400 });
  }

  const userId = session.user.id;

  // Simple creation hub costs 3 credits
  const cost = 3;
  if (!(await checkCredits(userId, cost))) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  try {
    let inputData = description || "";
    if (url) {
      const scraped = await scrapeWebsite(url);
      inputData = `URL: ${url}\nSCRAPED DATA: ${scraped}\n${description ? `USER NOTES: ${description}` : ""}`;
    }

    const systemPrompt = `ROLE: Senior Ad Strategist & Creative Director.
TASK: Analyze the provided input and generate a complete production brief for a 15-second high-conversion UGC-style video ad.

PROCESS:
1. Extract the "One Big Problem" the product solves.
2. Write a 15-second UGC-style script (Hook, Value, CTA) - approx 40-50 words.
3. Generate 3 simple, text-free cinematic scene descriptions focusing on the product/subject.
4. Select the best AI Actor and Voice Tone automatically.

OUTPUT FORMAT: Return ONLY a JSON object:
{
  "strategy": { "target": "", "tone": "", "hook_type": "" },
  "copy": { "headline": "", "body": "", "cta": "" },
  "scenes": [
    { "scene_num": 1, "visual_prompt": "", "duration": 5 },
    { "scene_num": 2, "visual_prompt": "", "duration": 5 },
    { "scene_num": 3, "visual_prompt": "", "duration": 5 }
  ],
  "audio": { "music_style": "afrobeats|cinematic|pop|hip-hop", "actor_id": "ava-001" }
}`;

    const aiRes = await generateText({
      system: systemPrompt,
      prompt: `Input Data:\n${inputData}`,
      maxTokens: 2000,
    });

    const jsonMatch = aiRes.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON");
    const architected = JSON.parse(jsonMatch[0]);

    // Create the Ad in database immediately
    const newAd = await prisma.ad.create({
      data: {
        userId,
        type: "VIDEO",
        platform: aspectRatio === "9:16" ? "TIKTOK,INSTAGRAM,FACEBOOK" : "FACEBOOK,INSTAGRAM",
        status: "GENERATING",
        headline: architected.copy.headline,
        bodyText: architected.copy.body,
        callToAction: architected.copy.cta,
        script: architected.copy.body,
        visualInstructions: architected.scenes.map((s: any) => s.visual_prompt).join("\n"),
        musicGenre: architected.audio.music_style,
        aspectRatio,
        language: "en",
        score: 85,
        images: image ? imagesToString([image]) : null,
        thumbnailUrl: image || null,
      },
    });

    await deductCredits(userId, cost);

    // Background generation of AI scenes if no image provided
    if (!image) {
      Promise.all(
        architected.scenes.map((s: any) => 
          generateImage({ 
            prompt: s.visual_prompt, 
            aspectRatio: aspectRatio as any, 
            quality: "high" 
          }).catch(() => null)
        )
      ).then(async (imageUrls) => {
        const validImages = imageUrls.filter(Boolean) as string[];
        if (validImages.length > 0) {
          await prisma.ad.update({
            where: { id: newAd.id },
            data: {
              images: imagesToString(validImages),
              thumbnailUrl: validImages[0],
              status: "READY"
            }
          });
        }
      });
    } else {
       await prisma.ad.update({
         where: { id: newAd.id },
         data: { status: "READY" }
       });
    }

    return NextResponse.json({ adId: newAd.id });
  } catch (err) {
    console.error("Simple Hub Engine error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
