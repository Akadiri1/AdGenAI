"use client";

import { useState, useRef } from "react";
import { Download, Film, Loader2, Check } from "lucide-react";

type Props = {
  clips: { url: string; scene: number }[];
  adId: string;
};

type StitchState = "idle" | "loading-ffmpeg" | "downloading" | "stitching" | "done" | "error";

export function VideoStitcher({ clips, adId }: Props) {
  const [state, setState] = useState<StitchState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const blobUrlRef = useRef<string | null>(null);

  async function stitch() {
    if (clips.length === 0) return;

    // Single clip — just download directly
    if (clips.length === 1) {
      const a = document.createElement("a");
      a.href = clips[0].url;
      a.download = `famousli-ad-scene1.mp4`;
      a.click();
      return;
    }

    setState("loading-ffmpeg");
    setProgress(5);
    setErrorMsg("");

    try {
      // Lazy-load ffmpeg only in browser, only when user clicks
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL(
          "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js",
          "text/javascript"
        ),
        wasmURL: await toBlobURL(
          "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm",
          "application/wasm"
        ),
      });

      setState("downloading");
      setProgress(20);

      // Download all clips into ffmpeg virtual FS
      const sorted = [...clips].sort((a, b) => a.scene - b.scene);
      for (let i = 0; i < sorted.length; i++) {
        setProgress(20 + Math.floor((i / sorted.length) * 40));
        const data = await fetchFile(sorted[i].url);
        await ffmpeg.writeFile(`clip${i}.mp4`, data);
      }

      // Build concat list
      const list = sorted.map((_, i) => `file 'clip${i}.mp4'`).join("\n");
      await ffmpeg.writeFile("list.txt", new TextEncoder().encode(list));

      setState("stitching");
      setProgress(70);

      // Try stream copy first (fast), fall back to re-encode if needed
      try {
        await ffmpeg.exec(["-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "out.mp4"]);
      } catch {
        setProgress(80);
        await ffmpeg.exec([
          "-f", "concat", "-safe", "0", "-i", "list.txt",
          "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac",
          "out.mp4",
        ]);
      }

      setProgress(95);
      const raw = await ffmpeg.readFile("out.mp4");
      const data = raw instanceof Uint8Array ? raw : new TextEncoder().encode(raw as string);
      const plain = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
      const blob = new Blob([plain], { type: "video/mp4" });

      // Revoke previous blob URL if any
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `famousli-ad-${adId.slice(0, 8)}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setState("done");
      setProgress(100);
    } catch (err) {
      setState("error");
      setErrorMsg((err as Error).message.slice(0, 120));
    }
  }

  const labels: Record<StitchState, string> = {
    idle: `Download as one MP4 (${clips.length} scenes)`,
    "loading-ffmpeg": "Loading video processor… (~15s first time)",
    downloading: "Downloading clips…",
    stitching: "Stitching scenes together…",
    done: "Downloaded!",
    error: "Failed — try again",
  };

  const busy = ["loading-ffmpeg", "downloading", "stitching"].includes(state);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={stitch}
        disabled={busy || clips.length === 0}
        className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-lg transition-all disabled:opacity-60 ${
          state === "done" ? "bg-success" :
          state === "error" ? "bg-danger hover:bg-danger/90" :
          "bg-primary hover:bg-primary-dark"
        }`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> :
         state === "done" ? <Check className="h-4 w-4" /> :
         <Film className="h-4 w-4" />}
        {labels[state]}
      </button>

      {busy && (
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-secondary">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] text-text-secondary text-center">
            {state === "loading-ffmpeg" && "First time only — cached after this"}
            {state === "downloading" && "Fetching your scene clips…"}
            {state === "stitching" && "Combining into one MP4…"}
          </p>
        </div>
      )}

      {state === "error" && (
        <p className="text-[11px] text-danger">{errorMsg}</p>
      )}

      {state === "done" && (
        <p className="text-[11px] text-success text-center">
          ✓ All {clips.length} scenes combined into one file
        </p>
      )}
    </div>
  );
}
