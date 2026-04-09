import { Queue, Worker, type JobsOptions } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

// Lazily construct connection — avoids connect attempts at build time
let _connection: IORedis | null = null;
export function getRedis(): IORedis {
  if (_connection) return _connection;
  _connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  return _connection;
}

export const QUEUE_NAMES = {
  POST_AD: "post-ad",
  GENERATE_VIDEO: "generate-video",
  SYNC_METRICS: "sync-metrics",
} as const;

let _postQueue: Queue | null = null;
export function getPostQueue(): Queue {
  if (_postQueue) return _postQueue;
  _postQueue = new Queue(QUEUE_NAMES.POST_AD, { connection: getRedis() });
  return _postQueue;
}

export type PostAdJobData = {
  adId: string;
  userId: string;
};

const DEFAULT_JOB_OPTS: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 30_000 },
  removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },
  removeOnFail: { age: 30 * 24 * 3600 },
};

export async function enqueuePostAd(data: PostAdJobData, scheduledAt?: Date) {
  const queue = getPostQueue();
  const delay = scheduledAt ? Math.max(0, scheduledAt.getTime() - Date.now()) : 0;
  return queue.add("post-ad", data, { ...DEFAULT_JOB_OPTS, delay });
}

export function createPostWorker(
  handler: (data: PostAdJobData) => Promise<void>,
): Worker {
  return new Worker(
    QUEUE_NAMES.POST_AD,
    async (job) => handler(job.data as PostAdJobData),
    { connection: getRedis(), concurrency: 5 },
  );
}
