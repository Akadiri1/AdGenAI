/**
 * Browser-side video stitcher using ffmpeg.wasm.
 * This file is ONLY ever imported via dynamic import with ssr:false,
 * never statically imported (would crash Next.js SSR build).
 */
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

type ProgressCallback = (message: string, percent: number) => void;

const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

export class VideoStitcher {
  private ffmpeg: FFmpeg;
  private loaded = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async load(onProgress?: ProgressCallback): Promise<void> {
    if (this.loaded) return;
    onProgress?.("Loading video processor (~30MB, cached after first use)…", 5);
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
    this.loaded = true;
  }

  async concat(videoUrls: string[], onProgress?: ProgressCallback): Promise<Blob> {
    if (!this.loaded) await this.load(onProgress);
    if (videoUrls.length === 0) throw new Error("No videos");
    if (videoUrls.length === 1) {
      onProgress?.("Preparing…", 80);
      const res = await fetch(videoUrls[0]);
      onProgress?.("Done", 100);
      return new Blob([await res.arrayBuffer()], { type: "video/mp4" });
    }

    for (let i = 0; i < videoUrls.length; i++) {
      onProgress?.(`Downloading clip ${i + 1} of ${videoUrls.length}…`, 10 + Math.floor(i / videoUrls.length * 50));
      await this.ffmpeg.writeFile(`clip${i}.mp4`, await fetchFile(videoUrls[i]));
    }

    const list = videoUrls.map((_, i) => `file 'clip${i}.mp4'`).join("\n");
    await this.ffmpeg.writeFile("list.txt", new TextEncoder().encode(list));
    onProgress?.("Stitching…", 70);

    await this.ffmpeg.exec(["-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "out.mp4"]);

    onProgress?.("Finalizing…", 95);
    const data = await this.ffmpeg.readFile("out.mp4");
    onProgress?.("Done", 100);
    // Copy into a plain ArrayBuffer to satisfy Blob constructor type
    const src = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string);
    const plain = src.buffer.slice(src.byteOffset, src.byteOffset + src.byteLength) as ArrayBuffer;
    return new Blob([plain], { type: "video/mp4" });
  }
}

let _instance: VideoStitcher | null = null;
export function getStitcher(): VideoStitcher {
  if (!_instance) _instance = new VideoStitcher();
  return _instance;
}
