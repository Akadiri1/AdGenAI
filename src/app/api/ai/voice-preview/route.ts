/**
 * POST /api/ai/voice-preview
 * Returns audio as a base64 data URL so the browser can play it instantly
 * without any storage dependency (no R2, no localhost URL mismatch).
 *
 * Cost: ~60 chars × $0.10/1K ElevenLabs = $0.006 per click.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { isElevenLabsConfigured } from "@/lib/elevenlabs";
import { isReplicateConfigured } from "@/lib/replicate";

const bodySchema = z.object({
  voiceId: z.string().min(3).max(100).optional(),
  gender: z.enum(["male", "female"]).optional(),
});

const PREVIEW_PHRASE =
  "Okay, I have to tell you about this. I've been using it every single day and honestly? I don't know how I lived without it.";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`voice-preview:${session.user.id}:${getClientKey(req)}`, 20, 60_000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    if (isElevenLabsConfigured()) {
      const apiKey = process.env.ELEVENLABS_API_KEY!;
      const voiceId = body.voiceId ?? (body.gender === "male" ? "nPczCjzI2devNBz1zQrb" : "EXAVITQu4vr4xnSDxMaL");

      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: PREVIEW_PHRASE,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.1, use_speaker_boost: true },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`ElevenLabs ${res.status}: ${err.slice(0, 200)}`);
      }

      const buf = Buffer.from(await res.arrayBuffer());
      const dataUrl = `data:audio/mpeg;base64,${buf.toString("base64")}`;
      return NextResponse.json({ url: dataUrl, provider: "elevenlabs" });
    }

    if (isReplicateConfigured()) {
      // Kokoro fallback — returns a URL from Replicate (publicly accessible temp URL)
      const { generateVoiceover } = await import("@/lib/replicate");
      const voice = body.gender === "male" ? "am_michael" : "af_bella";
      const audioUrl = await generateVoiceover({ text: PREVIEW_PHRASE, voice });
      // Fetch and convert to data URL so browser doesn't face CORS issues
      const res = await fetch(audioUrl);
      const buf = Buffer.from(await res.arrayBuffer());
      const dataUrl = `data:audio/mpeg;base64,${buf.toString("base64")}`;
      return NextResponse.json({ url: dataUrl, provider: "kokoro" });
    }

    return NextResponse.json({ error: "No TTS provider configured" }, { status: 503 });
  } catch (err) {
    return NextResponse.json({ error: "Preview failed", details: (err as Error).message }, { status: 500 });
  }
}
