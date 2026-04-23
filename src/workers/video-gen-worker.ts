/**
 * Dedicated worker for handling multi-step AI video generation.
 * Handles HeyGen + Background AI + FFmpeg Merging.
 * Run with: npx tsx src/workers/video-gen-worker.ts
 */
import { Worker } from "bullmq";
import { getRedis, QUEUE_NAMES } from "@/lib/queue";
import { prisma } from "@/lib/prisma";
import { completeVideoProduction } from "@/lib/video";

const worker = new Worker(
  QUEUE_NAMES.GENERATE_VIDEO,
  async (job) => {
    const { adId, userId, avatarId, script, visualInstructions, productImages, aspectRatio } = job.data;

    try {
      console.log(`[VideoWorker] Starting production for Ad ${adId}...`);
      
      const finalUrl = await completeVideoProduction({
        userId,
        avatarId,
        script,
        visualInstructions,
        productImages,
        aspectRatio,
        onStatus: async (status) => {
          console.log(`[VideoWorker] Ad ${adId}: ${status}`);
          // Update DB with current sub-status
          await prisma.ad.update({
            where: { id: adId },
            data: { bodyText: status } // Temporarily using bodyText to store status for UI
          });
        }
      });

      // Mark ad as ready
      await prisma.ad.update({
        where: { id: adId },
        data: {
          videoUrl: finalUrl,
          thumbnailUrl: finalUrl, // HeyGen usually provides a thumb, but finalUrl works
          status: "READY",
          bodyText: script // Restore original script text
        }
      });

      console.log(`[VideoWorker] Ad ${adId} completed successfully!`);
    } catch (err) {
      console.error(`[VideoWorker] Ad ${adId} failed:`, err);
      await prisma.ad.update({
        where: { id: adId },
        data: { status: "FAILED" }
      });
    }
  },
  { connection: getRedis(), concurrency: 2 }
);

console.log("🚀 Video Generation Worker is running...");
