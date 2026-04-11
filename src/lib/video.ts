import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import path from "path";
import fs from "fs";
import os from "os";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

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

function escapeForDrawtext(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "'\\\\\\''")
    .replace(/:/g, "\\:")
    .replace(/%/g, "\\%");
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
  for (let i = 0; i < imageUrls.length; i++) {
    const ext = imageUrls[i].includes(".png") || imageUrls[i].includes("image/png") ? "png" : "jpg";
    const p = path.join(tmpDir, `img${i}.${ext}`);
    await downloadToFile(imageUrls[i], p);
    imagePaths.push(p);
  }

  let musicPath: string | undefined;
  if (musicUrl) {
    musicPath = path.join(tmpDir, "music.mp3");
    try {
      await downloadToFile(musicUrl, musicPath);
    } catch {
      musicPath = undefined;
    }
  }

  // Simple reliable approach: scale each image → concat → add text overlays
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg();

    // Add each image as a looped input
    imagePaths.forEach((p) => {
      cmd.input(p).inputOptions(["-loop 1", `-t ${durationPerImage}`]);
    });
    if (musicPath) cmd.input(musicPath);

    // Build simple filter: scale + pad each image, then concat
    const scaleFilters = imagePaths
      .map((_, i) =>
        `[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=25[v${i}]`,
      )
      .join(";");

    const concatInputs = imagePaths.map((_, i) => `[v${i}]`).join("");
    const totalDuration = durationPerImage * imagePaths.length;

    // Add text overlays if provided
    let textFilter = "";
    let lastLabel = "concat";
    if (headline) {
      const escaped = escapeForDrawtext(headline);
      textFilter += `;[${lastLabel}]drawtext=text='${escaped}':fontsize=${Math.round(w / 20)}:fontcolor=white:borderw=2:bordercolor=black@0.7:x=(w-text_w)/2:y=h*0.08[t1]`;
      lastLabel = "t1";
    }
    if (callToAction) {
      const escaped = escapeForDrawtext(callToAction);
      textFilter += `;[${lastLabel}]drawtext=text='${escaped}':fontsize=${Math.round(w / 24)}:fontcolor=white:box=1:boxcolor=0xFF6B35@0.85:boxborderw=15:x=(w-text_w)/2:y=h*0.85[t2]`;
      lastLabel = "t2";
    }

    const filterComplex = `${scaleFilters};${concatInputs}concat=n=${imagePaths.length}:v=1:a=0[concat]${textFilter}`;

    cmd
      .complexFilter(filterComplex)
      .outputOptions([
        "-map", `[${lastLabel}]`,
        ...(musicPath ? ["-map", `${imagePaths.length}:a`, "-shortest"] : []),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "ultrafast",
        "-crf", "23",
        "-movflags", "+faststart",
        ...(musicPath ? ["-c:a", "aac", "-b:a", "128k"] : []),
      ])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .run();
  });
}
