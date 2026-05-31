import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateImage } from "@/lib/images";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Check user plan to restrict to paid users as requested
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, credits: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isPaid = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"].includes(user.plan);
    if (!isPaid) {
      return NextResponse.json({ error: "Face Swap and Custom Face Generation is only available on Pro plans." }, { status: 403 });
    }

    // Generate the image
    const imageUrl = await generateImage({
      prompt: `Close-up portrait photo of ${prompt}. Clear face, looking directly at the camera, neutral lighting, solid background, high quality photography.`,
      aspectRatio: "1:1",
      quality: "standard"
    });

    return NextResponse.json({ url: imageUrl });
  } catch (err) {
    console.error("[generate-image] error:", err);
    return NextResponse.json(
      { error: "Failed to generate image", details: (err as Error).message },
      { status: 500 }
    );
  }
}
