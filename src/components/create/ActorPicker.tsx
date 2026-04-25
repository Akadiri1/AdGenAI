"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, Filter } from "lucide-react";

type Actor = {
  id: string;
  name: string;
  imageUrl: string;
  gender: string | null;
  ageRange: string | null;
  vibe: string | null;
  setting: string | null;
  isStock: boolean;
};

const FILTERS = {
  gender: ["female", "male", "non-binary"],
  ageRange: ["young-adult", "adult", "mature", "senior"],
  vibe: ["confident", "friendly", "energetic", "calm", "professional", "edgy", "warm"],
};

export function ActorPicker({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (actor: Actor) => void;
}) {
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(filters);
    fetch(`/api/actors?${params}`)
      .then((r) => r.json())
      .then((d) => setActors(d.actors ?? []))
      .finally(() => setLoading(false));
  }, [filters]);

  function toggleFilter(key: string, value: string) {
    setFilters((f) => {
      if (f[key] === value) {
        const { [key]: _removed, ...rest } = f;
        return rest;
      }
      return { ...f, [key]: value };
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Pick an actor ({actors.length})
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 text-xs font-semibold text-text-primary hover:bg-bg-secondary"
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {Object.keys(filters).length > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-white">{Object.keys(filters).length}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="mb-3 space-y-2 rounded-2xl border border-black/10 bg-bg-secondary/40 p-3">
          {(Object.entries(FILTERS) as [string, string[]][]).map(([key, values]) => (
            <div key={key}>
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary">{key}</div>
              <div className="flex flex-wrap gap-1.5">
                {values.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleFilter(key, v)}
                    className={`rounded-lg border px-2 py-1 text-[10px] font-semibold capitalize transition-colors ${
                      filters[key] === v
                        ? "border-primary bg-primary text-white"
                        : "border-black/10 bg-white text-text-secondary hover:bg-bg-secondary"
                    }`}
                  >
                    {v.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
        </div>
      ) : actors.length === 0 ? (
        <p className="py-12 text-center text-sm text-text-secondary">No actors match those filters.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {actors.map((a) => {
            const selected = selectedId === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onSelect(a)}
                className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                  selected ? "border-primary scale-105 shadow-md shadow-primary/30" : "border-black/10 hover:border-black/20"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.imageUrl} alt={a.name} className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                  <div className="text-[10px] font-bold text-white truncate">{a.name}</div>
                  {a.vibe && <div className="text-[9px] text-white/80 capitalize truncate">{a.vibe}</div>}
                </div>
                {selected && (
                  <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                {!a.isStock && (
                  <div className="absolute left-1 top-1 rounded-md bg-accent/90 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
                    Yours
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
