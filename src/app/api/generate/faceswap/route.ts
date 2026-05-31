import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetVideoUrl, sourceImageUrl } = await req.json();

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

  if (user.credits < 3) {
    return NextResponse.json({ error: "Not enough credits. Face Swap requires 3 credits." }, { status: 402 });
  }

  try {
    // Deduct 3 credits
    await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { decrement: 3 } },
    });

    // Create a job in DB
    const job = await prisma.faceSwapJob.create({
      data: {
        userId: session.user.id,
        targetVideoUrl,
        sourceImageUrl,
        status: "PROCESSING",
      },
    });

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

    // Step 2: We'll use a standard face swap model on Replicate
    // facefusion or roop. For example: lucataco/faceswap
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/replicate-faceswap?secret=${process.env.REPLICATE_WEBHOOK_SECRET || "dev-secret"}`;

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

    const replicateData = await res.json();

    if (!res.ok) {
      // Refund credits
      await prisma.user.update({
        where: { id: session.user.id },
        data: { credits: { increment: 3 } },
      });
      await prisma.faceSwapJob.update({
        where: { id: job.id },
        data: { status: "FAILED", error: replicateData.detail || "Replicate API error" },
      });
      throw new Error(`Replicate failed: ${JSON.stringify(replicateData)}`);
    }

    // Update job with replicate ID
    await prisma.faceSwapJob.update({
      where: { id: job.id },
      data: { replicateId: replicateData.id },
    });

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (err) {
    console.error("[faceswap-error]", err);
    return NextResponse.json({ error: "Failed to start face swap job." }, { status: 500 });
  }
}
