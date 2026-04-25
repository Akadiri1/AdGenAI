/**
 * Legacy video generation worker — DISABLED.
 *
 * The new pipeline (POST /api/generate/ecommerce) calls Kling on Replicate
 * directly inside the request handler. Each scene's predictionId is persisted,
 * and the client polls /api/ads/[id]/scenes to get final video URLs.
 *
 * Kept as a stub so any old import doesn't break the build.
 */

console.log("[video-gen-worker] This worker has been retired. Generation now happens inline in /api/generate/ecommerce.");

export {};
