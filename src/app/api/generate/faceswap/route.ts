import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVoiceover } from "@/lib/tts";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetVideoUrl, sourceImageUrl, script, voice } = await req.json();

  if (!targetVideoUrl || !sourceImageUrl) {
    return NextResponse.json({ error: "Both video and face image are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, credits: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isPaid = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"].includes(user.plan);
  if (!isPaid) {
    return NextResponse.json({ error: "Face Swap is a premium feature. Please upgrade your plan." }, { status: 403 });
  }

  const requiredCredits = script ? 6 : 3;
  if (user.credits < requiredCredits) {
    return NextResponse.json({ error: `Not enough credits. This requires ${requiredCredits} credits.` }, { status: 402 });
  }

  try {
    // Deduct credits
    await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { decrement: requiredCredits } },
    });

    // Create a job in DB
    const job = await prisma.faceSwapJob.create({
      data: {
        userId: session.user.id,
        targetVideoUrl,
        sourceImageUrl,
        status: script ? "PROCESSING_LIPSYNC" : "PROCESSING_FACESWAP",
      },
    });

    // Step 0: Generate TTS Audio if Script is provided
    let audioUrl: string | null = null;
    if (script && voice) {
      try {
        const ttsRes = await generateVoiceover({
          text: script,
          settings: { voiceId: voice }
        });
        audioUrl = ttsRes.audioUrl;
      } catch (err) {
        throw new Error("Failed to generate AI voice audio: " + (err as Error).message);
      }
    }

    // Step 1: Enhance the source image using CodeFormer (Synchronous Wait)
    const enhanceRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
        "Prefer": "wait=30" // Blocks up to 30s until prediction completes
      },
      body: JSON.stringify({
        version: "7de2ea26c61f14f133718f0a40af28daef7d216518fb193fa0e6b52865910bba",
        input: {
          image: sourceImageUrl,
          upscale: 2,
          face_upsample: true,
          background_enhance: true,
          codeformer_fidelity: 0.5
        }
      }),
    });

    let finalFaceUrl = sourceImageUrl; // Fallback
    try {
      const enhanceData = await enhanceRes.json();
      if (enhanceRes.ok && enhanceData.status === "succeeded" && enhanceData.output) {
        finalFaceUrl = enhanceData.output;
      } else {
        console.warn("Face enhancement didn't complete in time or failed:", enhanceData);
      }
    } catch (e) {
      console.warn("Failed to parse face enhancement response", e);
    }

    // Step 2 & 3: Lip Sync OR Face Swap
    let replicateData;
    
    if (audioUrl) {
      // Launch Lip Sync Model First
      const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/replicate-faceswap?secret=${process.env.REPLICATE_WEBHOOK_SECRET || "dev-secret"}&step=lipsync`;
      
      const res = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "c200593466185fc4651e065bc3eec4b29bb64a780bbf23db71192e22fc75cbac", // fofr/lipsync (a much faster LipSync model than video-retalking)
          input: {
            video: targetVideoUrl,
            audio: audioUrl,
          },
          webhook: webhookUrl,
          webhook_events_filter: ["completed"],
        }),
      });
      replicateData = await res.json();
      if (res.status === 402 || replicateData.detail?.includes?.("credit")) {
        throw new Error("Your Replicate API key is out of credits. Please top up your Replicate account.");
      }
      if (!res.ok) throw new Error(`Replicate failed: ${JSON.stringify(replicateData)}`);
      
    } else {
      // Skip Lip Sync, Go straight to Face Swap
      const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/replicate-faceswap?secret=${process.env.REPLICATE_WEBHOOK_SECRET || "dev-secret"}&step=faceswap`;
      
      const res = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "9a4298548422074c3f57258c5d544497314ae4112df80d116f0d2109e843d20d", // lucataco/faceswap
          input: {
            target_video: targetVideoUrl,
            swap_image: finalFaceUrl,
          },
          webhook: webhookUrl,
          webhook_events_filter: ["completed"],
        }),
      });
      replicateData = await res.json();
      if (res.status === 402 || replicateData.detail?.includes?.("credit")) {
        throw new Error("Your Replicate API key is out of credits. Please top up your Replicate account.");
      }
      if (!res.ok) throw new Error(`Replicate failed: ${JSON.stringify(replicateData)}`);
    }

    // Update job with replicate ID
    await prisma.faceSwapJob.update({
      where: { id: job.id },
      data: { replicateId: replicateData.id },
    });

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (err: any) {
    console.error("[faceswap-error]", err);
    // Refund credits on failure
    await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { increment: requiredCredits } },
    });
    return NextResponse.json({ error: err.message || "Failed to start processing job." }, { status: 500 });
  }
}
