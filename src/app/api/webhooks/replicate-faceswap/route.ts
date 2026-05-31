import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");

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
      await prisma.faceSwapJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          resultVideoUrl: typeof output === "string" ? output : undefined,
        },
      });
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
        data: { credits: { increment: 3 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[faceswap-webhook-error]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
