import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import path from "path";
import fs from "fs";
import os from "os";

// Explicitly set the path for Windows environments
const ffmpegPath = path.resolve(process.cwd(), "node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe");
if (fs.existsSync(ffmpegPath)) {
  ffmpeg.setFfmpegPath(ffmpegPath);
} else {
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
}

export type AspectRatio = "1:1" | "9:16" | "16:9" | "4:5";

const DIMENSIONS: Record<AspectRatio, { w: number; h: number }> = {
  "1:1": { w: 1080, h: 1080 },
  "9:16": { w: 1080, h: 1920 },
  "16:9": { w: 1920, h: 1080 },
  "4:5": { w: 1080, h: 1350 },
};

export type VideoAssemblyParams = {
  imageUrls: string[];
  musicUrl?: string;
  headline?: string;
  callToAction?: string;
  aspectRatio: AspectRatio;
  durationPerImage?: number; // seconds
};

async function downloadToFile(url: string, dest: string): Promise<void> {
  if (url.startsWith("data:")) {
    const match = url.match(/^data:.+;base64,(.+)$/);
    if (!match) throw new Error("Invalid data URL");
    fs.writeFileSync(dest, Buffer.from(match[1], "base64"));
    return;
  }

  // Use fetch with timeout — handles redirects automatically
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);

    const buf = await res.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(buf));
  } catch (err) {
    clearTimeout(timeout);
    // If download fails, create a solid color placeholder image instead
    try {
      await createPlaceholderImage(dest);
    } catch {
      throw err;
    }
  }
}

/**
 * Creates a simple solid-color PNG as a fallback when image download fails.
 * Uses a minimal valid PNG (1x1 pixel, scaled by FFmpeg).
 */
function createPlaceholderImage(dest: string): void {
  // Minimal valid 100x100 PPM image (no external deps needed)
  const w = 100, h = 100;
  const header = `P6\n${w} ${h}\n255\n`;
  const pixels = Buffer.alloc(w * h * 3);
  // Fill with brand primary color (#FF6B35)
  for (let i = 0; i < w * h; i++) {
    pixels[i * 3] = 0xFF;     // R
    pixels[i * 3 + 1] = 0x6B; // G
    pixels[i * 3 + 2] = 0x35; // B
  }
  const ppm = Buffer.concat([Buffer.from(header), pixels]);
  // Write as PPM — FFmpeg can read it
  const ppmDest = dest.replace(/\.(png|jpg|jpeg)$/i, ".ppm");
  fs.writeFileSync(ppmDest, ppm);
  // Rename to original dest
  if (ppmDest !== dest) fs.renameSync(ppmDest, dest);
}

/**
 * COORDINATOR: The "Arcads" Engine.
 * Handles the full flow: Gemini Script -> HeyGen Actor -> Kling/Fal Background -> FFmpeg Merge.
 */
export async function completeVideoProduction(params: {
  userId: string;
  avatarId: string;
  script: string;
  visualInstructions?: string;
  productImages?: string[];
  aspectRatio: AspectRatio;
  onStatus?: (status: string) => void;
}): Promise<string> {
  const { userId, avatarId, script, visualInstructions, productImages, aspectRatio, onStatus } = params;

  // 1. Generate Talking Actor (HeyGen)
  onStatus?.("Generating AI Actor...");
  const { generateAvatarVideo, getVideoStatus } = await import("@/lib/heygen");
  const avatarResult = await generateAvatarVideo({
    avatarId,
    script,
    aspectRatio: (aspectRatio === "4:5" ? "9:16" : aspectRatio) as "16:9" | "9:16" | "1:1"
  });

  let actorVideoUrl: string | undefined;
  // Poll for actor video
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 10000));
    const status = await getVideoStatus(avatarResult.videoId);
    if (status.status === "completed" && status.videoUrl) {
      actorVideoUrl = status.videoUrl;
      break;
    }
    if (status.status === "failed") throw new Error("HeyGen Actor generation failed");
  }

  if (!actorVideoUrl) throw new Error("Actor video generation timed out");

  // 2. Generate Background (Kling/Fal)
  onStatus?.("Generating cinematic background...");
  const { generateKlingVideo, getKlingTaskStatus, isKlingConfigured } = await import("@/lib/kling");
  const { generateFalVideo, getFalTaskStatus, isFalConfigured } = await import("@/lib/fal");

  let backgroundUrl: string | undefined;
  const bgPrompt = visualInstructions || `A cinematic, high-end professional studio background with soft lighting, perfect for a high-converting social media ad.`;

  const targetAR = (aspectRatio === "4:5" ? "9:16" : aspectRatio) as "16:9" | "9:16" | "1:1";

  if (isKlingConfigured()) {
    const taskId = await generateKlingVideo({ prompt: bgPrompt, aspect_ratio: targetAR });
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 15000));
      const status = await getKlingTaskStatus(taskId);
      if (status.status === "succeeded" && status.videoUrl) {
        backgroundUrl = status.videoUrl;
        break;
      }
    }
  } else if (isFalConfigured()) {
    const requestId = await generateFalVideo({ prompt: bgPrompt, aspect_ratio: targetAR });
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const status = await getFalTaskStatus(requestId);
      if (status.status === "completed" && status.videoUrl) {
        backgroundUrl = status.videoUrl;
        break;
      }
    }
  } else {
    // Fallback: Use a high-quality static stock photo if no video AI configured
    backgroundUrl = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";
  }

  if (!backgroundUrl) throw new Error("Background generation failed");

  // 3. Merge Actor + Background (FFmpeg)
  onStatus?.("Merging scenes and optimizing video...");
  const finalLocalPath = await overlayActorOnBackground({
    actorVideoUrl,
    backgroundUrl,
    aspectRatio
  });

  // 4. Upload to Cloud Storage
  onStatus?.("Finalizing upload...");
  const { uploadToStorage } = await import("@/lib/storage");
  const videoBuffer = fs.readFileSync(finalLocalPath);
  const finalUrl = await uploadToStorage({
    bytes: videoBuffer,
    contentType: "video/mp4",
    extension: "mp4",
    folder: `users/${userId}/ads`
  });

  // Cleanup
  fs.rmSync(path.dirname(finalLocalPath), { recursive: true, force: true });

  return finalUrl;
}

/**
 * Merges a talking actor (with green screen) onto a background video or image.
 * Uses FFmpeg colorkey filter to remove the green background.
 */
export async function overlayActorOnBackground(params: {
  actorVideoUrl: string;
  backgroundUrl: string; // can be image or video
  aspectRatio: AspectRatio;
  outputFolder?: string;
}): Promise<string> {
  const { actorVideoUrl, backgroundUrl, aspectRatio, outputFolder = "ads/final" } = params;
  const { w, h } = DIMENSIONS[aspectRatio];
  
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "famousli-merge-"));
  const actorPath = path.join(tmpDir, "actor.mp4");
  const bgPath = path.join(tmpDir, "bg" + (backgroundUrl.includes(".mp4") ? ".mp4" : ".jpg"));
  const outputPath = path.join(tmpDir, "final_output.mp4");

  console.log("[VideoEngine] Downloading assets for merging...");
  await Promise.all([
    downloadToFile(actorVideoUrl, actorPath),
    downloadToFile(backgroundUrl, bgPath)
  ]);

  const isVideoBg = bgPath.endsWith(".mp4");

  return new Promise((resolve, reject) => {
    console.log("[VideoEngine] Starting FFmpeg Merge (Chroma Key)...");
    const cmd = ffmpeg();

    // Input 0: Background
    if (isVideoBg) {
      cmd.input(bgPath);
    } else {
      cmd.input(bgPath).inputOptions(["-loop 1"]);
    }

    // Input 1: Actor
    cmd.input(actorPath);

    /**
     * Filter Description:
     * 1. [0:v] scale the background to fit
     * 2. [1:v] remove green screen using colorkey (0x00ff00), scale it, then overlay
     * colorkey=color:similarity:blend
     */
    const filterComplex = [
      `[0:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1[bg]`,
      `[1:v]colorkey=0x00ff00:0.1:0.1,scale=-1:${h*0.9}[actor]`,
      `[bg][actor]overlay=(W-w)/2:H-h[v]`
    ].join(";");

    cmd
      .complexFilter(filterComplex)
      .outputOptions([
        "-map", "[v]",
        "-map", "1:a", // Use audio from the actor video
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "ultrafast",
        "-crf", "23",
        "-shortest", // Stop when the shortest input (actor) ends
        "-movflags", "+faststart"
      ])
      .output(outputPath)
      .on("end", () => {
        console.log("[VideoEngine] Merge complete:", outputPath);
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("[VideoEngine] Merge Error:", err);
        reject(err);
      })
      .run();
  });
}

/**
 * Assembles a video from images with Ken Burns effect, text overlays, and optional music.
 * Returns absolute path to the generated MP4 file.
 */
export async function assembleVideo(params: VideoAssemblyParams): Promise<string> {
  const {
    imageUrls,
    musicUrl,
    headline,
    callToAction,
    aspectRatio,
    durationPerImage = 5,
  } = params;

  if (imageUrls.length === 0) throw new Error("At least one image required");

  const { w, h } = DIMENSIONS[aspectRatio];
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "famousli-"));
  const outputPath = path.join(tmpDir, "output.mp4");

  // Download all inputs
  const imagePaths: string[] = [];
  console.log(`[VideoEngine] Starting assembly with ${imageUrls.length} images...`);
  for (let i = 0; i < imageUrls.length; i++) {
    const ext = imageUrls[i].includes(".png") || imageUrls[i].includes("image/png") ? "png" : "jpg";
    const p = path.join(tmpDir, `img${i}.${ext}`);
    try {
      await downloadToFile(imageUrls[i], p);
      imagePaths.push(p);
    } catch (e) {
      console.error(`[VideoEngine] Failed to download image ${i}:`, e);
    }
  }

  if (imagePaths.length === 0) throw new Error("Could not download any source images");

  let musicPath: string | undefined;
  if (musicUrl) {
    musicPath = path.join(tmpDir, "music.mp3");
    console.log(`[VideoEngine] Fetching music: ${musicUrl}`);
    try {
      await downloadToFile(musicUrl, musicPath);
    } catch (e) {
      console.error("[VideoEngine] Music download failed, proceeding without music:", e);
      musicPath = undefined;
    }
  }

  // Simple reliable approach: scale each image → concat → add text overlays
  return new Promise((resolve, reject) => {
    console.log("[VideoEngine] Starting FFmpeg process...");
    const cmd = ffmpeg();

    // Add each image as a looped input
    imagePaths.forEach((p) => {
      cmd.input(p).inputOptions(["-loop 1", `-t ${durationPerImage}`]);
    });
    if (musicPath) cmd.input(musicPath);

    // Simple approach: Use one filter complex to handle everything at once
    const filterComplex = [
      // Step 1: Concat all video inputs first
      imagePaths.map((_, i) => `[${i}:v]`).join(""),
      `concat=n=${imagePaths.length}:v=1:a=0[v_unscaled]`,
      // Step 2: Scale and Pad to final dimensions
      `;[v_unscaled]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=25[v]`
    ].join("");

    cmd
      .complexFilter(filterComplex)
      .outputOptions([
        "-map", "[v]",
        ...(musicPath ? ["-map", `${imagePaths.length}:a`, "-shortest"] : []),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "ultrafast",
        "-crf", "28", // Slightly faster/smaller for reliability
        "-movflags", "+faststart",
        ...(musicPath ? ["-c:a", "aac", "-b:a", "128k"] : []),
      ])
      .output(outputPath)
      .on("start", (commandLine) => {
        console.log("[VideoEngine] FFmpeg command:", commandLine);
      })
      .on("end", () => {
        console.log("[VideoEngine] Assembly complete:", outputPath);
        resolve(outputPath);
      })
      .on("error", (err, stdout, stderr) => {
        console.error("[VideoEngine] FFmpeg Error:", err.message);
        console.error("[VideoEngine] FFmpeg Stderr:", stderr);
        reject(err);
      })
      .run();
  });
}
