import { Film } from "lucide-react";

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
  platform: string[];
};

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  GENERATING: "bg-blue-100 text-blue-700 animate-pulse",
  READY: "bg-green-100 text-green-700",
  SCHEDULED: "bg-yellow-100 text-yellow-700",
  POSTING: "bg-blue-100 text-blue-700 animate-pulse",
  POSTED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  PAUSED: "bg-gray-100 text-gray-700",
};

export function AdCard({ ad }: { ad: Ad }) {
  const aspectClass =
    ad.aspectRatio === "9:16" ? "aspect-[9/16]"
    : ad.aspectRatio === "16:9" ? "aspect-[16/9]"
    : ad.aspectRatio === "4:5" ? "aspect-[4/5]"
    : "aspect-square";

  return (
    <div className="group overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className={`relative ${aspectClass} overflow-hidden bg-bg-secondary`}>
        {ad.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.thumbnailUrl} alt={ad.headline ?? "Ad"} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center"><Film className="h-10 w-10 text-text-secondary" /></div>
        )}
        <div className="absolute left-2 top-2 flex gap-1.5">
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusStyles[ad.status] ?? "bg-gray-100 text-gray-700"}`}>
            {ad.status}
          </span>
          {ad.score !== null && (
            <span className="rounded-md bg-white/90 px-2 py-0.5 text-xs font-bold text-text-primary backdrop-blur">
              {Math.round(ad.score)}/100
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="mb-1 line-clamp-1 font-heading font-bold text-text-primary">
          {ad.headline ?? "Untitled ad"}
        </h3>
        <p className="mb-3 line-clamp-2 text-sm text-text-secondary">{ad.bodyText}</p>
        <div className="flex flex-wrap gap-1">
          {ad.platform.map((p) => (
            <span key={p} className="rounded bg-bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
