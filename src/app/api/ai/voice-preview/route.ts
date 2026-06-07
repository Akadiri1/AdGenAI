/**
 * POST /api/ai/voice-preview
 * Returns audio as a base64 data URL so the browser can play it instantly.
 *
 * Priority: Qwen (New Default) → ElevenLabs → Replicate
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { isElevenLabsConfigured } from "@/lib/elevenlabs";
import { isReplicateConfigured } from "@/lib/replicate";
import { generateQwenSpeech, isQwenConfigured } from "@/lib/qwen";

const bodySchema = z.object({
  voiceId: z.string().min(3).max(100).optional(),
  gender: z.enum(["male", "female"]).optional(),
  speed:             z.number().min(0.5).max(2.0).optional(),
  stability:         z.number().min(0).max(1).optional(),
  similarity:        z.number().min(0).max(1).optional(),
  styleExaggeration: z.number().min(0).max(1).optional(),
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
    // 1. QWEN CLOUD (Primary)
    if (isQwenConfigured()) {
      try {
        // If voiceId looks like an ElevenLabs ID (20 chars alphanumeric), 
        // ignore it and use Qwen defaults for this provider.
        const isExternalId = body.voiceId && /^[a-zA-Z0-9]{15,}$/.test(body.voiceId);
        const voice = (isExternalId || !body.voiceId) 
          ? (body.gender === "male" ? "Ethan" : "Cherry")
          : body.voiceId;

        console.log(`[voice-preview] Using Qwen voice: ${voice} (Original: ${body.voiceId})`);
        
        const audioUrl = await generateQwenSpeech({
          text: PREVIEW_PHRASE,
          voice,
          speed: body.speed,
        });

        const res = await fetch(audioUrl);
        const buf = Buffer.from(await res.arrayBuffer());
        const dataUrl = `data:audio/mpeg;base64,${buf.toString("base64")}`;
        return NextResponse.json({ url: dataUrl, provider: "qwen" });
      } catch (err) {
        console.warn("[voice-preview] Qwen failed, falling back:", (err as Error).message);
      }
    }

    // 2. ELEVENLABS (Secondary - currently restricted for Free tier)
    if (isElevenLabsConfigured()) {
      try {
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
            voice_settings: {
              stability:        body.stability         ?? 0.5,
              similarity_boost: body.similarity        ?? 0.75,
              style:            body.styleExaggeration ?? 0.1,
              speed: Math.min(1.2, Math.max(0.7, body.speed ?? 1.0)),
              use_speaker_boost: true,
            },
          }),
        });

        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          const dataUrl = `data:audio/mpeg;base64,${buf.toString("base64")}`;
          return NextResponse.json({ url: dataUrl, provider: "elevenlabs" });
        }
      } catch (err) {
        console.warn("[voice-preview] ElevenLabs failed, falling back:", (err as Error).message);
      }
    }

    // 3. REPLICATE (Final Fallback)
    if (isReplicateConfigured()) {
      const { generateVoiceover } = await import("@/lib/replicate");
      const voice = body.gender === "male" ? "am_michael" : "af_bella";
      const audioUrl = await generateVoiceover({ text: PREVIEW_PHRASE, voice });
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
