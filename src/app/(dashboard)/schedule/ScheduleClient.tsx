"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Calendar, Video, CheckCircle2, MoreVertical, ExternalLink } from "lucide-react";

type Ad = {
  id: string;
  type: string;
  platform: string;
  status: string;
  headline: string | null;
  thumbnailUrl: string | null;
  scheduledAt: string | Date | null;
  [key: string]: any;
};

export function ScheduleClient({ initialAds }: { initialAds: Ad[] }) {
  const [ads] = useState<Ad[]>(initialAds);

  const getPlatformColor = (platform: string) => {
    if (!platform) return 'bg-gray-100 text-gray-800';
    const p = platform.toLowerCase();
    if (p.includes('tiktok')) return 'bg-black text-white';
    if (p.includes('instagram')) return 'bg-gradient-to-tr from-yellow-400 to-fuchsia-600 text-white';
    if (p.includes('youtube')) return 'bg-red-600 text-white';
    if (p.includes('facebook')) return 'bg-blue-600 text-white';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {ads.map(ad => (
        <div key={ad.id} className="bg-white rounded-2xl border border-black/5 p-4 flex items-center gap-6 hover:shadow-md transition-shadow">
          <div className="h-16 w-16 rounded-xl bg-bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden">
            {ad.thumbnailUrl ? (
              <img src={ad.thumbnailUrl} alt={ad.headline || "Ad thumbnail"} className="h-full w-full object-cover" />
            ) : (
              <Video className="h-6 w-6 text-text-secondary/50" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-text-primary truncate">
              {ad.headline || "Untitled Scheduled Ad"}
            </h3>
            <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
              <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${getPlatformColor(ad.platform?.split(',')[0])}`}>
                {ad.platform?.split(',')[0] || "Unknown"}
              </span>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{ad.scheduledAt ? new Date(ad.scheduledAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{ad.scheduledAt ? new Date(ad.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${ad.status === 'POSTED' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
              {ad.status}
            </div>
            <Link href={`/ads/${ad.id}`} className="p-2 hover:bg-black/5 rounded-lg transition-colors text-text-secondary">
              <ExternalLink className="h-5 w-5" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
