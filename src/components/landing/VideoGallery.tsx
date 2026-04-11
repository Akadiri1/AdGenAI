"use client";

import { useEffect, useRef, useState } from "react";
import { Play, X, Volume2, VolumeX } from "lucide-react";

export type DemoVideo = {
  id: string;
  src: string;          // mp4 URL (in /public or remote)
  poster?: string;      // thumbnail image URL
  title: string;
  tagline?: string;
  vertical?: boolean;   // 9:16 vs 16:9 (default true for ad demos)
};

/**
 * Arcads-style video gallery — autoplays muted on hover, click to fullscreen with sound.
 */
export function VideoGallery({ videos }: { videos: DemoVideo[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);

  const open = videos.find((v) => v.id === openId) ?? null;

  return (
    <>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} onOpen={() => setOpenId(v.id)} />
        ))}
      </div>

      {open && (
        <FullscreenPlayer
          video={open}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}

function VideoCard({ video, onOpen }: { video: DemoVideo; onOpen: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (hovering) {
      el.play().catch(() => { /* autoplay blocked, ignore */ });
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [hovering]);

  return (
    <button
      type="button"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
      onClick={onOpen}
      className="group relative overflow-hidden rounded-2xl border border-black/5 bg-bg-dark shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl text-left"
    >
      <div className={`relative ${video.vertical === false ? "aspect-video" : "aspect-[9/16]"} bg-bg-dark`}>
        <video
          ref={ref}
          src={video.src}
          poster={video.poster}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Play button overlay (fades on hover) */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/0 transition-colors">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all group-hover:scale-110 group-hover:bg-white/30">
            <Play className="h-6 w-6 text-white ml-1" fill="white" />
          </div>
        </div>

        {/* Gradient + text overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
          <div className="font-heading text-sm font-bold text-white">{video.title}</div>
          {video.tagline && (
            <div className="text-[11px] text-white/80 mt-0.5 leading-snug">{video.tagline}</div>
          )}
        </div>
      </div>
    </button>
  );
}

function FullscreenPlayer({
  video, muted, onToggleMute, onClose,
}: {
  video: DemoVideo;
  muted: boolean;
  onToggleMute: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = muted;
    el.play().catch(() => { /* ignore */ });
  }, [muted]);

  // Close on Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-[min(420px,100vw)]"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={ref}
          src={video.src}
          poster={video.poster}
          autoPlay
          loop
          muted={muted}
          playsInline
          controls={false}
          className="max-h-[90vh] w-full rounded-2xl object-contain"
        />

        {/* Top controls */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 rounded-b-2xl bg-gradient-to-t from-black/90 to-transparent p-5 pt-12">
          <div className="font-heading text-lg font-bold text-white">{video.title}</div>
          {video.tagline && <div className="text-sm text-white/80 mt-1">{video.tagline}</div>}
        </div>
      </div>
    </div>
  );
}
