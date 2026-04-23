// Image generation abstraction — produces high-quality ad graphics.
import { uploadToStorage } from "@/lib/storage";

export type ImageQuality = "standard" | "high";

export type ImageGenParams = {
  prompt: string;
  aspectRatio?: "1:1" | "9:16" | "16:9" | "4:5";
  negativePrompt?: string;
  quality?: ImageQuality;
};

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

  // Priority: SiliconFlow (Fastest/Reliable) -> Gemini -> Replicate -> Stability -> Fallback
  if (process.env.SILICONFLOW_API_KEY) {
    try {
      return await generateWithSiliconFlow(enhanced, aspectRatio);
    } catch (e) {
      console.error("SiliconFlow image failed:", e);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return await generateWithGemini(enhanced, aspectRatio);
    } catch (e) {
      console.error("Gemini image failed:", e);
    }
  }

  if (process.env.REPLICATE_API_TOKEN) {
    try {
      return await generateWithReplicate(enhanced, aspectRatio, quality);
    } catch (e) {
      console.error("Replicate image failed:", e);
    }
  }

  if (process.env.STABILITY_API_KEY) {
    try {
      return await generateWithStability(enhanced, aspectRatio, negativePrompt, quality);
    } catch (e) {
      console.error("Stability image failed:", e);
    }
  }

  // Final emergency fallback: Unsplash source
  const [w, h] =
    aspectRatio === "1:1" ? [1024, 1024]
    : aspectRatio === "9:16" ? [1080, 1920]
    : aspectRatio === "16:9" ? [1920, 1080]
    : [1080, 1350];
    
  return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=${w}&h=${h}&fit=crop&q=80`;
}

async function generateWithSiliconFlow(
  prompt: string,
  aspectRatio: string,
): Promise<string> {
  const res = await fetch("https://api.siliconflow.cn/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SILICONFLOW_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-schnell",
      prompt,
      image_size: aspectRatio === "1:1" ? "1024x1024" : aspectRatio === "9:16" ? "720x1280" : "1024x768",
      batch_size: 1,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`SiliconFlow failed: ${res.status} ${JSON.stringify(data)}`);
  
  // SiliconFlow usually returns url in images[0].url
  const url = data.images?.[0]?.url || data.data?.[0]?.url;
  if (!url) throw new Error("No image URL in SiliconFlow response");

  const imgRes = await fetch(url);
  const buf = await imgRes.arrayBuffer();
  return uploadToStorage({
    bytes: Buffer.from(buf),
    contentType: "image/png",
    extension: "png",
    folder: "ads/images",
  });
}

async function generateWithGemini(
  prompt: string,
  aspectRatio: string,
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  const model = "imagen-3";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) throw new Error(`Gemini Image failed: ${res.status}`);

  const data = await res.json();
  const base64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64) throw new Error("No image data in Gemini response");

  return uploadToStorage({
    bytes: Buffer.from(base64, "base64"),
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
  const model = quality === "high" ? "black-forest-labs/flux-1.1-pro" : "black-forest-labs/flux-schnell";
  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      version: model,
      input: { prompt, aspect_ratio: aspectRatio, output_format: "png" },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Replicate failed: ${res.status}`);
  const output = Array.isArray(data.output) ? data.output[0] : data.output;
  const imgRes = await fetch(output);
  const buf = await imgRes.arrayBuffer();
  return uploadToStorage({
    bytes: Buffer.from(buf),
    contentType: "image/png",
    extension: "png",
    folder: "ads/images",
  });
}

async function generateWithStability(
  prompt: string,
  aspectRatio: string,
  negativePrompt: string,
  quality: ImageQuality,
): Promise<string> {
  const endpoint = quality === "high"
    ? "https://api.stability.ai/v2beta/stable-image/generate/ultra"
    : "https://api.stability.ai/v2beta/stable-image/generate/core";

  const fd = new FormData();
  fd.append("prompt", prompt);
  fd.append("negative_prompt", negativePrompt);
  fd.append("aspect_ratio", aspectRatio);
  fd.append("output_format", "png");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STABILITY_API_KEY}`, Accept: "image/*" },
    body: fd,
  });
  if (!res.ok) throw new Error(`Stability failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  return uploadToStorage({
    bytes: Buffer.from(buf),
    contentType: "image/png",
    extension: "png",
    folder: "ads/images",
  });
}
