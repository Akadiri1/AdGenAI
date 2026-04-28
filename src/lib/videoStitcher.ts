/**
 * Browser-side video stitcher using ffmpeg.wasm.
 * Concatenates multiple MP4 clips into a single MP4 — runs entirely in the
 * user's browser, no server compute needed.
 *
 * Usage:
 *   const stitcher = new VideoStitcher();
 *   await stitcher.load(); // ~30MB download once, then cached
 *   const blob = await stitcher.concat([url1, url2, url3], (msg, pct) => {...});
 *   // download blob as MP4
 */
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

type ProgressCallback = (message: string, percent: number) => void;

const FFMPEG_CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

export class VideoStitcher {
  private ffmpeg: FFmpeg;
  private loaded = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async load(onProgress?: ProgressCallback): Promise<void> {
    if (this.loaded) return;
    onProgress?.("Loading video processor (~30MB, one time)…", 5);
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
    this.loaded = true;
  }

  async concat(videoUrls: string[], onProgress?: ProgressCallback): Promise<Blob> {
    if (!this.loaded) throw new Error("Stitcher not loaded — call load() first");
    if (videoUrls.length === 0) throw new Error("No videos to concat");
    if (videoUrls.length === 1) {
      // Trivial — fetch and return as-is
      onProgress?.("Preparing video…", 90);
      const res = await fetch(videoUrls[0]);
      const buf = await res.arrayBuffer();
      onProgress?.("Done", 100);
      return new Blob([buf], { type: "video/mp4" });
    }

    // Download each clip into ffmpeg's virtual filesystem
    for (let i = 0; i < videoUrls.length; i++) {
      const pct = 10 + Math.floor((i / videoUrls.length) * 50);
      onProgress?.(`Downloading clip ${i + 1} of ${videoUrls.length}…`, pct);
      const data = await fetchFile(videoUrls[i]);
      await this.ffmpeg.writeFile(`input${i}.mp4`, data);
    }

    // Build the concat list file (FFmpeg concat demuxer format)
    const concatList = videoUrls.map((_, i) => `file 'input${i}.mp4'`).join("\n");
    await this.ffmpeg.writeFile("concat.txt", new TextEncoder().encode(concatList));

    onProgress?.("Stitching clips together…", 70);

    // Use the concat demuxer with stream copy when possible (fast, no re-encode)
    // If clips have different codecs/sizes, fall back to re-encode.
    try {
      await this.ffmpeg.exec([
        "-f", "concat",
        "-safe", "0",
        "-i", "concat.txt",
        "-c", "copy",
        "output.mp4",
      ]);
    } catch {
      // Re-encode fallback (slower but handles mismatched clips)
      onProgress?.("Re-encoding for compatibility…", 80);
      await this.ffmpeg.exec([
        "-f", "concat",
        "-safe", "0",
        "-i", "concat.txt",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-c:a", "aac",
        "output.mp4",
      ]);
    }

    onProgress?.("Finalizing…", 95);
    const data = await this.ffmpeg.readFile("output.mp4");
    const buf = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);

    // Clean up
    for (let i = 0; i < videoUrls.length; i++) {
      try { await this.ffmpeg.deleteFile(`input${i}.mp4`); } catch { /* ignore */ }
    }
    try { await this.ffmpeg.deleteFile("concat.txt"); } catch { /* ignore */ }
    try { await this.ffmpeg.deleteFile("output.mp4"); } catch { /* ignore */ }

    onProgress?.("Done", 100);
    return new Blob([buf as BlobPart], { type: "video/mp4" });
  }
}

// Singleton — load once, reuse across the app
let _instance: VideoStitcher | null = null;
export function getStitcher(): VideoStitcher {
  if (!_instance) _instance = new VideoStitcher();
  return _instance;
}
