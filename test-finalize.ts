import { config } from "dotenv";
config();

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

import { generateVoiceover } from "./src/lib/tts";
import { createPrediction } from "./src/lib/replicate-internal";

async function testFinalize() {
  const adId = 'cmqbd15xh0002kz047ic7fhr6';
  
  const ad = await prisma.ad.findUnique({
    where: { id: adId },
    include: {
      actor: true,
      scenes: {
        where: { status: "READY", finalClipUrl: null },
        orderBy: { sceneNumber: "asc" },
      },
    },
  });

  if (!ad || ad.scenes.length === 0) {
    console.log("No scenes to finalize");
    return;
  }

  const scene = ad.scenes[0];
  const spokenText = (scene.spokenLine?.trim() || "").slice(0, 300);
  console.log(`Processing scene ${scene.id} with text: "${spokenText}"`);

  let audioUrl = null;
  // Try TTS
  try {
    console.log("Generating TTS...");
    const tts = await generateVoiceover({
      text: spokenText,
      settings: undefined,
      actor: { gender: ad.actor?.gender, age: "middle", vibe: ad.actor?.vibe },
      language: ad.language,
    });
    audioUrl = tts.audioUrl;
    console.log("TTS URL:", audioUrl);
  } catch (e) {
    console.error("TTS Failed:", e);
  }

  // Try Lip Sync
  try {
    console.log("Starting Lip Sync Prediction...");
    const input = { video_url: scene.videoClipUrl };
    if (audioUrl) {
      input.audio_file = audioUrl;
    } else {
      input.text = spokenText;
      input.voice_id = "male"; // default
    }
    console.log("Lip sync input:", input);
    const prediction = await createPrediction("kwaivgi/kling-lip-sync", undefined, input);
    console.log("Prediction started:", prediction.id);
  } catch (e) {
    console.error("Lip Sync Failed:", e);
  }
}

testFinalize().catch(console.error).finally(() => prisma.$disconnect());
