/**
 * Generate or rewrite a product image from a text description.
 * POST /api/ai/product-image
 *   { description: string, productName?: string, mode?: "generate" | "rewrite" }
 * → { url: string }
 *
 * Uses the generateImage abstraction (FLUX via SiliconFlow/Replicate, Imagen via Gemini).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { generateImage } from "@/lib/images";
import { rateLimit, getClientKey } from "@/lib/rateLimit";

const bodySchema = z.object({
  description: z.string().min(3).max(500),
  productName: z.string().max(120).optional(),
  mode: z.enum(["generate", "rewrite"]).default("generate"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`prodimg:${session.user.id}:${getClientKey(req)}`, 30, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "Invalid request", details: (err as Error).message }, { status: 400 });
  }

  const subject = body.productName ? `${body.productName} — ${body.description}` : body.description;
  const variation = body.mode === "rewrite" ? ", alternative angle, fresh composition" : "";

  const prompt = `Product photograph of ${subject}${variation}. Pure clean studio backdrop, soft diffused lighting, sharp focus on the product, hero shot, e-commerce catalog style, no people, no text, no logos.`;

  try {
    const url = await generateImage({
      prompt,
      aspectRatio: "1:1",
      quality: "high",
    });
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: "Image generation failed", details: (err as Error).message }, { status: 500 });
  }
}
