import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const QWEN_KEY = process.env.QWEN_API_KEY;

async function main() {
  const stuckScenes = await prisma.scene.findMany({
    where: {
      OR: [
        { status: "GENERATING_VIDEO", klingTaskId: null },
        { status: "FAILED" }
      ],
      ad: { status: "GENERATING" }
    },
    include: { ad: { include: { actor: true } } }
  });

  if (stuckScenes.length === 0) {
    console.log("No scenes to restart.");
    return;
  }

  console.log(`Restarting ${stuckScenes.length} scenes with simplified Qwen settings...`);

  const resolutionMap = {
    "9:16": "720*1280",
    "16:9": "1280*720",
    "1:1": "960*960"
  };

  for (const scene of stuckScenes) {
    try {
      console.log(`Scene ${scene.sceneNumber} of Ad ${scene.adId}...`);
      const aspectRatio = (scene.ad.aspectRatio || "9:16");
      
      // Simplify prompt to avoid internal DashScope errors
      const simplePrompt = scene.prompt.split('.')[0] + ". " + (scene.spokenLine || "");

      const res = await fetch("https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${QWEN_KEY}`,
          "Content-Type": "application/json",
          "X-DashScope-Async": "enable"
        },
        body: JSON.stringify({
          model: "wan2.1-t2v-plus",
          input: { prompt: simplePrompt },
          parameters: {
            resolution: resolutionMap[aspectRatio] || "720*1280",
            duration: scene.durationSeconds <= 5 ? 5 : 10,
            prompt_extend: false // CRITICAL: Disable rewriter
          }
        }),
      });

      const data = await res.json();
      if (res.ok && data.output?.task_id) {
        await prisma.scene.update({
          where: { id: scene.id },
          data: { 
            klingTaskId: data.output.task_id,
            status: "GENERATING_VIDEO",
            editInstructions: null
          },
        });
        console.log(`  ✅ Task ID: ${data.output.task_id}`);
      } else {
        console.error(`  ❌ Failed: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.error(`  ❌ Error:`, err.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
