"use client";

import { useEffect, useState } from "react";
import { Play, X, ExternalLink } from "lucide-react";
import { TIKTOK_VIDEOS, tiktokUrl, type TikTokVideo } from "@/lib/tiktokVideos";

/**
 * Landing page gallery of real TikTok videos.
 *
 * - Grid of vertical 9:16 cards with gradient + caption
 * - Click any card → fullscreen modal with the official TikTok embed iframe
 *   (uses TikTok's first-party player at https://www.tiktok.com/embed/v2/{id})
 * - Esc to close, click backdrop to close
 * - "Open on TikTok" link in the modal as a fallback
 */
export function TikTokGallery() {
  const [openVideo, setOpenVideo] = useState<TikTokVideo | null>(null);

  return (
    <>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {TIKTOK_VIDEOS.map((v, i) => (
          <TikTokCard key={v.videoId} video={v} index={i} onOpen={() => setOpenVideo(v)} />
        ))}
      </div>

      {openVideo && <TikTokModal video={openVideo} onClose={() => setOpenVideo(null)} />}
    </>
  );
}

function TikTokCard({
  video, index, onOpen,
}: { video: TikTokVideo; index: number; onOpen: () => void }) {
  // Pseudo-random gradient per card so the grid looks alive even before TikTok loads
  const gradients = [
    "from-primary/70 via-accent/60 to-warning/50",
    "from-secondary/70 via-primary/60 to-accent/50",
    "from-accent/70 via-warning/60 to-primary/50",
    "from-warning/70 via-primary/60 to-secondary/50",
    "from-primary/60 via-secondary/70 to-accent/60",
    "from-accent/60 via-primary/70 to-warning/60",
  ];
  const gradient = gradients[index % gradients.length];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative overflow-hidden rounded-2xl border border-black/5 bg-bg-dark shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl text-left w-full"
    >
      <div className={`relative aspect-[9/16] bg-gradient-to-br ${gradient}`}>
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center transition-colors group-hover:bg-black/10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 backdrop-blur-md transition-all group-hover:scale-110 group-hover:bg-white/40">
            <Play className="h-6 w-6 text-white ml-1" fill="white" />
          </div>
        </div>

        {/* TikTok badge */}
        <div className="absolute top-3 right-3 rounded-md bg-black/60 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          TikTok
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3">
          {video.category && (
            <div className="mb-1 inline-block rounded bg-white/15 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              {video.category}
            </div>
          )}
          <div className="text-xs sm:text-sm font-semibold text-white leading-tight line-clamp-2">
            {video.caption}
          </div>
          <div className="mt-1 text-[10px] text-white/70 truncate">@{video.username}</div>
        </div>
      </div>
    </button>
  );
}

function TikTokModal({ video, onClose }: { video: TikTokVideo; onClose: () => void }) {
  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // TikTok official embed URL
  const embedUrl = `https://www.tiktok.com/embed/v2/${video.videoId}?lang=en-US`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top controls */}
        <div className="absolute -top-2 right-0 sm:right-2 flex gap-2 z-10">
          <a
            href={tiktokUrl(video)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 text-white hover:bg-white/30 transition-colors text-xs font-semibold"
            title="Open on TikTok"
          >
            <ExternalLink className="h-4 w-4" /> Open on TikTok
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Iframe wrapper */}
        <div className="mt-12 overflow-hidden rounded-2xl bg-black shadow-2xl">
          <iframe
            src={embedUrl}
            title={`TikTok video by @${video.username}`}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            className="w-full"
            style={{ height: "min(80vh, 740px)", border: 0 }}
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      </div>
    </div>
  );
}
