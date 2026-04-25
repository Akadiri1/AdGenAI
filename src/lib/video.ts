/**
 * Legacy video assembly module — RETIRED.
 * Previously used FFmpeg. Now using Kling 2.6 Pro via Replicate.
 * See: src/lib/replicate.ts, /api/generate/ecommerce, /api/ads/[id]/scenes
 */

export type AspectRatio = "1:1" | "9:16" | "16:9" | "4:5";

export async function assembleVideo(): Promise<never> {
  throw new Error("FFmpeg slideshow assembly removed. Use Kling pipeline at /api/generate/ecommerce.");
}

export async function completeVideoProduction(): Promise<never> {
  throw new Error("completeVideoProduction is retired.");
}

