"use client";

import Link from "next/link";
import { Film, Clock, Sparkles } from "lucide-react";

type Ad = {
  id: string;
  type: string;
  status: string;
  headline: string | null;
  bodyText: string | null;
  callToAction: string | null;
  thumbnailUrl: string | null;
  aspectRatio: string;
  score: number | null;
  platform: string | string[];
  productName?: string | null;
  duration?: number | null;
  createdAt?: Date | string;
};

const STATUS_STYLE: Record<string, { bg: string; label: string }> = {
  DRAFT:      { bg: "bg-warning/90 text-white",    label: "Draft" },
  GENERATING: { bg: "bg-accent/90 text-white animate-pulse", label: "Generating…" },
  READY:      { bg: "bg-success/90 text-white",    label: "Ready" },
  PROMPT_ONLY:{ bg: "bg-bg-secondary/90 text-text-secondary", label: "Prompts" },
  SCHEDULED:  { bg: "bg-primary/90 text-white",    label: "Scheduled" },
  POSTED:     { bg: "bg-success/90 text-white",    label: "Posted" },
  FAILED:     { bg: "bg-danger/90 text-white",     label: "Failed" },
};

// Gradient backgrounds keyed by ad status for blank-thumbnail fallback
const GRADIENT: Record<string, string> = {
  DRAFT:      "from-warning/20 via-bg-secondary to-warning/10",
  GENERATING: "from-accent/20 via-bg-secondary to-primary/10",
  READY:      "from-success/20 via-bg-secondary to-accent/10",
  FAILED:     "from-danger/20 via-bg-secondary to-warning/10",
  DEFAULT:    "from-primary/20 via-bg-secondary to-secondary/10",
};

function isVideoUrl(url: string) {
  return url.includes(".mp4") || url.includes("delivery") || url.includes("replicate.delivery");
}

export function AdCard({ ad }: { ad: Ad }) {
  const aspectClass = ad.aspectRatio === "9:16" ? "aspect-[9/16]"
    : ad.aspectRatio === "16:9" ? "aspect-[16/9]"
    : "aspect-square";

  const status = STATUS_STYLE[ad.status] ?? STATUS_STYLE.DRAFT;
  const gradient = GRADIENT[ad.status] ?? GRADIENT.DEFAULT;
  const title = ad.headline ?? ad.productName ?? "Untitled ad";
  const platforms = Array.isArray(ad.platform) ? ad.platform : (ad.platform ?? "").split(",").filter(Boolean);

  return (
    <Link href={`/ads/${ad.id}/studio`}
      className="group overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:border-primary/20 block">

      {/* Thumbnail / preview */}
      <div className={`relative ${aspectClass} overflow-hidden`}>
        {ad.thumbnailUrl ? (
          isVideoUrl(ad.thumbnailUrl) ? (
            <video src={ad.thumbnailUrl} muted playsInline
              className="h-full w-full object-cover"
              onMouseOver={e => (e.currentTarget as HTMLVideoElement).play()}
              onMouseOut={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.thumbnailUrl} alt={title} className="h-full w-full object-cover" />
          )
        ) : (
          /* Coloured gradient placeholder */
          <div className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${gradient} gap-3`}>
            {ad.status === "GENERATING" ? (
              <>
                <div className="h-10 w-10 rounded-full border-4 border-white/30 border-t-accent animate-spin" />
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Rendering…</span>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/50">
                  <Film className="h-6 w-6 text-text-secondary" />
                </div>
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  {ad.status === "DRAFT" ? "Draft — not generated yet" : "No preview"}
                </span>
              </>
            )}
          </div>
        )}

        {/* Status badge */}
        <div className="absolute left-2 top-2 flex items-center gap-1.5">
          <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ${status.bg}`}>
            {status.label}
          </span>
          {ad.score !== null && (
            <span className="rounded-lg bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              {Math.round(ad.score)}/100
            </span>
          )}
        </div>

        {/* Duration badge */}
        {ad.duration && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            <Clock className="h-2.5 w-2.5" />
            {ad.duration}s
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="rounded-xl bg-white/90 px-3 py-1.5 text-xs font-bold text-text-primary shadow-lg">
            Open Studio
          </span>
        </div>
      </div>

      {/* Info row */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="line-clamp-1 font-heading font-bold text-sm text-text-primary leading-tight">{title}</h3>
          {ad.status === "READY" && (
            <Sparkles className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />
          )}
        </div>
        {ad.bodyText && (
          <p className="line-clamp-1 text-[11px] text-text-secondary mb-2">{ad.bodyText}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {platforms.slice(0, 2).map((p) => (
            <span key={p} className="rounded bg-bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-text-secondary uppercase">
              {p}
            </span>
          ))}
          {platforms.length > 2 && (
            <span className="rounded bg-bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-text-secondary">
              +{platforms.length - 2}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
