"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdCard } from "@/components/ads/AdPreview";
import { Trash2, CheckSquare, Square, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import type { Platform } from "@/lib/adHelpers";

type Ad = {
  id: string;
  type: string;
  status: string;
  headline: string | null;
  bodyText: string | null;
  callToAction: string | null;
  platform: Platform[];
  thumbnailUrl: string | null;
  videoUrl: string | null;
  images: string | null;
  aspectRatio: string;
  score: number | null;
  createdAt: Date | string;
};

export function AdsListClient({ initialAds }: { initialAds: Ad[] }) {
  const router = useRouter();
  const { success, error } = useToast();
  const [ads, setAds] = useState(initialAds);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === ads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(ads.map((a) => a.id)));
    }
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    const count = selected.size;
    if (!confirm(`Delete ${count} ad${count > 1 ? "s" : ""}? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/ads/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");

      setAds((prev) => prev.filter((a) => !selected.has(a.id)));
      success(`Deleted ${data.deleted} ad${data.deleted > 1 ? "s" : ""}`);
      exitSelectMode();
      router.refresh();
    } catch (err) {
      error((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* Action bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {!selectMode ? (
          <button
            onClick={() => setSelectMode(true)}
            className="flex items-center gap-1.5 rounded-xl border-2 border-black/10 bg-white px-4 py-2 text-sm font-semibold text-text-primary hover:bg-bg-secondary transition-colors"
          >
            <CheckSquare className="h-4 w-4" /> Select
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-xs font-semibold text-text-primary hover:bg-bg-secondary"
            >
              {selected.size === ads.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              {selected.size === ads.length ? "Deselect all" : "Select all"}
            </button>
            <span className="text-sm font-semibold text-text-primary">
              {selected.size} selected
            </span>
            <button
              onClick={bulkDelete}
              disabled={selected.size === 0 || deleting}
              className="flex items-center gap-1.5 rounded-xl bg-danger px-4 py-2 text-xs font-semibold text-white hover:bg-danger/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? "Deleting..." : `Delete${selected.size > 0 ? ` (${selected.size})` : ""}`}
            </button>
            <button
              onClick={exitSelectMode}
              className="flex items-center gap-1.5 rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-xs font-semibold text-text-primary hover:bg-bg-secondary"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ads.map((ad) => {
          const isSelected = selected.has(ad.id);
          return (
            <div key={ad.id} className="relative">
              {selectMode ? (
                <button
                  type="button"
                  onClick={() => toggleOne(ad.id)}
                  className={`block w-full text-left rounded-3xl transition-all ${
                    isSelected ? "ring-4 ring-primary scale-[0.98]" : "hover:scale-[1.01]"
                  }`}
                >
                  <AdCard ad={ad} />
                  <div
                    className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg shadow-md ${
                      isSelected ? "bg-primary text-white" : "bg-white border-2 border-black/10"
                    }`}
                  >
                    {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-text-secondary" />}
                  </div>
                </button>
              ) : (
                <Link href={`/ads/${ad.id}`}>
                  <AdCard ad={ad} />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
