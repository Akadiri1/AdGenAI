// Image generation abstraction — produces high-quality ad graphics.
// Tier: FREE gets flux-schnell (fast, good). PRO+ gets flux-dev or SD3 Large (higher quality).

import { uploadToStorage } from "@/lib/storage";

export type ImageQuality = "standard" | "high";

export type ImageGenParams = {
  prompt: string;
  aspectRatio?: "1:1" | "9:16" | "16:9" | "4:5";
  negativePrompt?: string;
  quality?: ImageQuality;
};

/**
 * Enriches a user prompt with quality-boosting descriptors.
 * Makes ads look professional even when the user writes something terse.
 */
function enhancePrompt(prompt: string, quality: ImageQuality): string {
  const qualityBoost =
    quality === "high"
      ? "ultra high quality, 8k, professional commercial photography, award-winning advertisement, sharp focus, studio lighting, magazine quality, hyperdetailed, cinematic composition"
      : "high quality, professional photograph, commercial advertisement, sharp focus, good lighting, clean composition";

  return `${prompt}, ${qualityBoost}`;
}

const DEFAULT_NEGATIVE =
  "blurry, low quality, distorted, deformed, amateur, ugly, watermark, text, logo, signature, bad anatomy, bad hands, extra fingers, poorly drawn, grainy, oversaturated, out of focus, low resolution, pixelated";

export async function generateImage(params: ImageGenParams): Promise<string> {
  const {
    prompt,
    aspectRatio = "1:1",
    negativePrompt = DEFAULT_NEGATIVE,
    quality = "standard",
  } = params;

  const enhanced = enhancePrompt(prompt, quality);

  if (process.env.STABILITY_API_KEY) {
    return generateWithStability(enhanced, aspectRatio, negativePrompt, quality);
  }
  if (process.env.REPLICATE_API_TOKEN) {
    return generateWithReplicate(enhanced, aspectRatio, quality);
  }

  // Dev fallback: placeholder image
  const [w, h] =
    aspectRatio === "1:1" ? [1024, 1024]
    : aspectRatio === "9:16" ? [1080, 1920]
    : aspectRatio === "16:9" ? [1920, 1080]
    : [1080, 1350];
  return `https://picsum.photos/seed/${encodeURIComponent(prompt.slice(0, 40))}/${w}/${h}`;
}

async function generateWithStability(
  prompt: string,
  aspectRatio: string,
  negativePrompt: string,
  quality: ImageQuality,
): Promise<string> {
  // Standard: SD3 Core · High: SD3 Large (ultra)
  const endpoint = quality === "high"
    ? "https://api.stability.ai/v2beta/stable-image/generate/ultra"
    : "https://api.stability.ai/v2beta/stable-image/generate/core";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
      Accept: "image/*",
    },
    body: (() => {
      const fd = new FormData();
      fd.append("prompt", prompt);
      fd.append("negative_prompt", negativePrompt);
      fd.append("aspect_ratio", aspectRatio);
      fd.append("output_format", "png");
      fd.append("style_preset", "photographic");
      return fd;
    })(),
  });
  if (!res.ok) throw new Error(`Stability API failed: ${res.status} ${await res.text()}`);
  const buf = await res.arrayBuffer();
  // Upload to storage so social APIs can fetch it by URL
  return uploadToStorage({
    bytes: Buffer.from(buf),
    contentType: "image/png",
    extension: "png",
    folder: "ads/images",
  });
}

async function generateWithReplicate(
  prompt: string,
  aspectRatio: string,
  quality: ImageQuality,
): Promise<string> {
  // Standard: flux-schnell (4 steps, fast, $0.003/img)
  // High: flux-1.1-pro (40 steps, ultra-quality, $0.04/img)
  const model = quality === "high"
    ? "black-forest-labs/flux-1.1-pro"
    : "black-forest-labs/flux-schnell";

  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      version: model,
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        output_format: "png",
        output_quality: 95,
        ...(quality === "high" && { safety_tolerance: 2, prompt_upsampling: true }),
      },
    }),
  });
  if (!res.ok) throw new Error(`Replicate API failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const output = Array.isArray(data.output) ? data.output[0] : data.output;
  if (!output) throw new Error("No image returned from Replicate");

  // Replicate returns a URL that expires in 1 hour — we need to rehost it permanently.
  const imgRes = await fetch(output as string);
  if (!imgRes.ok) throw new Error("Could not fetch Replicate image");
  const buf = await imgRes.arrayBuffer();
  return uploadToStorage({
    bytes: Buffer.from(buf),
    contentType: "image/png",
    extension: "png",
    folder: "ads/images",
  });
}
