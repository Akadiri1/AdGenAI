"use client";

import { useState } from "react";
import Link from "next/link";
import { Film, Calendar, Clock, ChevronRight, Filter, Search, Trash2, Loader2, CheckSquare } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";

function getAdGradient(status: string) {
  const map: Record<string, string> = {
    DRAFT:      "bg-gradient-to-br from-warning/20 via-bg-secondary to-warning/5",
    GENERATING: "bg-gradient-to-br from-accent/20 via-bg-secondary to-primary/10",
    READY:      "bg-gradient-to-br from-success/20 via-bg-secondary to-accent/10",
    FAILED:     "bg-gradient-to-br from-danger/20 via-bg-secondary to-warning/10",
  };
  return map[status] ?? "bg-gradient-to-br from-primary/15 via-bg-secondary to-secondary/10";
}

type Ad = {
  id: string;
  type: string;
  platform: string;
  status: string;
  headline: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  createdAt: string | Date;
  [key: string]: any;
};

export function AdList({ initialAds }: { initialAds: Ad[] }) {
  const [ads, setAds] = useState(initialAds);
  const [search, setSearch] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const confirm = useConfirm();
  const { error: toastError } = useToast();

  const filteredAds = ads.filter(ad => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const headlineMatch = ad.headline?.toLowerCase().includes(searchLower);
    const platformMatch = ad.platform?.toLowerCase().includes(searchLower);
    return headlineMatch || platformMatch;
  });

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAds.map(ad => ad.id)));
    }
  };

  async function handleDelete() {
    const isDeletingAll = selectedIds.size === 0;
    const count = isDeletingAll ? ads.length : selectedIds.size;
    const ok = await confirm({
      title: isDeletingAll ? "Delete all ads?" : `Delete ${count} ad${count > 1 ? "s" : ""}?`,
      message: "This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;

    setIsDeleting(true);
    try {
      const body = isDeletingAll ? { deleteAll: true } : { ids: Array.from(selectedIds) };
      const res = await fetch("/api/ads/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to delete ads");
      if (isDeletingAll) {
        setAds([]);
      } else {
        setAds(ads.filter(ad => !selectedIds.has(ad.id)));
      }
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      toastError("An error occurred while deleting ads.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search ads..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-black/10 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-black/10 hover:bg-black/5 transition-colors">
          <Filter className="h-4 w-4" />
          Filter
        </button>
        {ads.length > 0 && (
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-danger/20 text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{selectedIds.size > 0 ? `Delete (${selectedIds.size})` : "Delete All"}</span>
          </button>
        )}
      </div>
      
      {filteredAds.length > 0 && (
        <div className="flex items-center justify-between px-2 text-sm text-text-secondary mb-2">
          <label className="flex items-center gap-2 cursor-pointer hover:text-text-primary">
            <input 
              type="checkbox" 
              className="rounded border-black/20 text-primary focus:ring-primary h-4 w-4"
              checked={selectedIds.size > 0 && selectedIds.size === filteredAds.length}
              onChange={toggleSelectAll}
            />
            Select All
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAds.map(ad => {
          const isSelected = selectedIds.has(ad.id);
          return (
            <Link key={ad.id} href={`/ads/${ad.id}`} className={`group block bg-white rounded-2xl border ${isSelected ? 'border-primary ring-1 ring-primary shadow-md' : 'border-black/5'} overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 relative`}>
              
              <div 
                className="absolute top-3 left-3 z-10 p-1.5"
                onClick={(e) => toggleSelect(e, ad.id)}
              >
                <div className={`h-5 w-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'bg-white/80 border-black/20 backdrop-blur-sm'}`}>
                  {isSelected && <CheckSquare className="h-3.5 w-3.5" />}
                </div>
              </div>

              {/* Thumbnail — uses composite/clip image, coloured gradient fallback */}
              <div className={`aspect-video relative overflow-hidden ${!ad.thumbnailUrl ? getAdGradient(ad.status) : ""}`}>
                {ad.thumbnailUrl ? (
                  ad.thumbnailUrl.includes(".mp4") || ad.thumbnailUrl.includes("delivery")
                    ? <video src={ad.thumbnailUrl} muted playsInline className="w-full h-full object-cover"
                        onMouseOver={e => (e.currentTarget as HTMLVideoElement).play()}
                        onMouseOut={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }} />
                    // eslint-disable-next-line @next/next/no-img-element
                    : <img src={ad.thumbnailUrl} alt={ad.headline || "Ad"} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center flex-col gap-2">
                    {ad.status === "GENERATING"
                      ? <div className="h-8 w-8 rounded-full border-4 border-white/30 border-t-accent animate-spin" />
                      : <Film className="h-8 w-8 text-text-secondary/60" />}
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                      {ad.status === "DRAFT" ? "Draft" : ad.status === "GENERATING" ? "Rendering…" : "No preview"}
                    </span>
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur text-[10px] font-bold text-white">
                  {ad.status}
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                  <span>{ad.platform?.split(',')[0] || "Unknown"}</span>
                  <span>•</span>
                  <span>{ad.type}</span>
                </div>
                <h3 className="font-heading font-bold text-text-primary mb-2 line-clamp-2">
                  {ad.headline || "Untitled Ad Campaign"}
                </h3>
                
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(ad.createdAt).toLocaleDateString()}</span>
                  </div>
                  {ad.duration && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{ad.duration}s</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="px-5 py-3 border-t border-black/5 bg-bg-secondary/50 flex items-center justify-between text-sm group-hover:bg-primary/5 transition-colors">
                <span className="font-semibold text-primary">View Details</span>
                <ChevronRight className="h-4 w-4 text-primary" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
