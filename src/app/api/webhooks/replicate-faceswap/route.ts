import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");
    const step = url.searchParams.get("step") || "faceswap";
    const creditsUsed = parseInt(url.searchParams.get("credits") || (step === "lipsync" ? "6" : "3"), 10);

    if (secret !== (process.env.REPLICATE_WEBHOOK_SECRET || "dev-secret")) {
      return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 });
    }

    const body = await req.json();
    const { id: replicateId, status, output, error } = body;

    const job = await prisma.faceSwapJob.findUnique({
      where: { replicateId },
    });

    if (!job) {
      console.warn(`[webhook] FaceSwapJob not found for replicateId: ${replicateId}`);
      return NextResponse.json({ success: true }); // Acknowledge to stop retries
    }

    if (status === "succeeded" && output) {
      if (step === "lipsync") {
        // Step 1 Completed! Now trigger Face Swap
        const nextWebhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/replicate-faceswap?secret=${process.env.REPLICATE_WEBHOOK_SECRET || "dev-secret"}&step=faceswap&credits=6`;
        
        try {
          // Launch Face Swap
          const res = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              version: "9a4298548422074c3f57258c5d544497314ae4112df80d116f0d2109e843d20d", // lucataco/faceswap
              input: {
                target_video: typeof output === "string" ? output : output[0], // Lip-sync output is usually a string URL
                swap_image: job.sourceImageUrl,
              },
              webhook: nextWebhookUrl,
              webhook_events_filter: ["completed"],
            }),
          });
          
          const replicateData = await res.json();
          if (!res.ok) throw new Error("Failed to launch face swap model");

          // Update job to link to new replicate prediction
          await prisma.faceSwapJob.update({
            where: { id: job.id },
            data: {
              status: "PROCESSING_FACESWAP",
              replicateId: replicateData.id,
            },
          });
        } catch (e) {
          // Failed to launch step 2
          await prisma.faceSwapJob.update({
            where: { id: job.id },
            data: { status: "FAILED", error: "Failed to launch Face Swap after Lip Sync" },
          });
          await prisma.user.update({
            where: { id: job.userId },
            data: { credits: { increment: creditsUsed } },
          });
        }
      } else {
        // Final Step Completed! (Or standard Face Swap)
        await prisma.faceSwapJob.update({
          where: { id: job.id },
          data: {
            status: "COMPLETED",
            resultVideoUrl: typeof output === "string" ? output : undefined,
          },
        });
      }
    } else if (status === "failed" || status === "canceled") {
      await prisma.faceSwapJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          error: error || "Replicate prediction failed or canceled",
        },
      });

      // Refund credits
      await prisma.user.update({
        where: { id: job.userId },
        data: { credits: { increment: creditsUsed } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[faceswap-webhook-error]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
