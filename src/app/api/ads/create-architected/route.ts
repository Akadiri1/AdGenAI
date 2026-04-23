import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { platformsToString } from "@/lib/adHelpers";
import { z } from "zod";

const bodySchema = z.object({
  headline: z.string(),
  bodyText: z.string(),
  callToAction: z.string(),
  script: z.string(),
  visualInstructions: z.string(),
  platforms: z.array(z.string()).default(["tiktok", "instagram"]),
});

/**
 * Internal API to create an ad from Architect results.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = bodySchema.parse(await req.json());

    const ad = await prisma.ad.create({
      data: {
        userId: session.user.id,
        type: "VIDEO",
        status: "READY",
        platform: platformsToString(body.platforms),
        headline: body.headline,
        bodyText: body.bodyText,
        callToAction: body.callToAction,
        script: body.script,
        visualInstructions: body.visualInstructions,
        aspectRatio: "9:16",
        language: "en",
      },
    });

    return NextResponse.json({ success: true, adId: ad.id });
  } catch (err) {
    console.error("Create architected ad error:", err);
    return NextResponse.json({ error: "Failed to create ad" }, { status: 500 });
  }
}
