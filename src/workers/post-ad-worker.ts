/**
 * Standalone BullMQ worker that processes the post-ad queue.
 * Run with: tsx src/workers/post-ad-worker.ts
 */
import { createPostWorker } from "@/lib/queue";
import { processPostAdJob } from "@/lib/postAd";

const worker = createPostWorker(processPostAdJob);

worker.on("completed", (job) => {
  console.log(`[post-ad] completed ${job.id}`);
});
worker.on("failed", (job, err) => {
  console.error(`[post-ad] failed ${job?.id}:`, err.message);
});

console.log("post-ad worker running…");
