"use client";

import { useEffect, useState } from "react";
import {
  Play, Loader2, Wand2, Check, AlertCircle, RotateCcw,
  Image as ImageIcon, Mic, Lightbulb,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useCredits } from "@/components/CreditsProvider";

type SceneStatus = "PENDING" | "COMPOSITING" | "GENERATING_VIDEO" | "READY" | "FAILED" | "PROMPT_ONLY";

type Scene = {
  id: string;
  sceneNumber: number;
  status: SceneStatus;
  durationSeconds: number;
  prompt: string;
  spokenLine: string | null;
  compositeImageUrl: string | null;
  videoClipUrl: string | null;
  editInstructions: string | null;
};

const QUICK_INSTRUCTIONS = [
  "make her smile more",
  "brighter, more cinematic lighting",
  "show the product closer",
  "more energetic, faster movement",
  "softer, calmer mood",
  "wider shot, show the setting",
  "tighter close-up on the face",
  "golden hour outdoor lighting",
];

export function SceneEditor({ adId }: { adId: string }) {
  const { error, success } = useToast();
  const { refreshCredits } = useCredits();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [adReady, setAdReady] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [refining, setRefining] = useState(false);

  // Poll scenes — every 5s while any scene is still generating
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch(`/api/ads/${adId}/scenes`, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        setScenes(data.scenes ?? []);
        setAdReady(data.adStatus === "READY");
      } catch { /* keep polling */ }
      finally {
        setLoading(false);
      }
    }
    tick();
    const id = setInterval(tick, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [adId]);

  async function refine(sceneId: string) {
    if (!instruction.trim()) {
      error("Write an instruction first");
      return;
    }
    setRefining(true);
    try {
      const res = await fetch(`/api/ads/${adId}/scenes/${sceneId}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Refine failed");
      success("Re-rendering with your instruction");
      setEditingId(null);
      setInstruction("");
      refreshCredits();
    } catch (err) {
      error((err as Error).message);
    } finally {
      setRefining(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-text-secondary" /></div>;
  }

  if (scenes.length === 0) {
    return <p className="py-12 text-center text-sm text-text-secondary">No scenes yet.</p>;
  }

  return (
    <div className="space-y-4">
      {!adReady && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold text-accent">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating your ad...
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Each scene takes about 30-60 seconds. We&apos;ll keep this page in sync — refresh anytime.
          </p>
        </div>
      )}

      {scenes.map((s) => (
        <div key={s.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[200px_1fr]">
            {/* Preview */}
            <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-bg-secondary">
              {s.videoClipUrl ? (
                <video src={s.videoClipUrl} controls className="h-full w-full object-cover" />
              ) : s.compositeImageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.compositeImageUrl} alt={`Scene ${s.sceneNumber}`} className="h-full w-full object-cover" />
                  {(s.status === "GENERATING_VIDEO" || s.status === "COMPOSITING") && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-2 text-white">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-[10px] font-semibold uppercase">Rendering video</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-text-secondary" />
                </div>
              )}

              <div className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                Scene {s.sceneNumber}
              </div>
              <div className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                {s.durationSeconds}s
              </div>
              {s.status === "READY" && (
                <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-success text-white">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
              {s.status === "FAILED" && (
                <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white">
                  <AlertCircle className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            {/* Details + edit */}
            <div className="flex flex-col gap-3">
              {s.spokenLine && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    <Mic className="h-3 w-3" /> Spoken line
                  </div>
                  <p className="text-sm text-text-primary italic">&ldquo;{s.spokenLine}&rdquo;</p>
                </div>
              )}

              <div>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Visual prompt
                </div>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{s.prompt}</p>
              </div>

              {/* Edit panel */}
              {editingId === s.id ? (
                <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    <Lightbulb className="h-3 w-3" /> Tell AI what to change
                  </div>
                  <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="e.g. make her smile more, show the product closer, brighter lighting..."
                    rows={2}
                    maxLength={500}
                    className="w-full resize-none rounded-lg border-2 border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                  <div>
                    <div className="mb-1 text-[10px] font-semibold text-text-secondary">Quick ideas:</div>
                    <div className="flex flex-wrap gap-1">
                      {QUICK_INSTRUCTIONS.map((qi) => (
                        <button
                          key={qi}
                          type="button"
                          onClick={() => setInstruction(qi)}
                          className="rounded-md border border-black/10 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-text-secondary hover:border-primary hover:text-primary"
                        >
                          {qi}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => refine(s.id)}
                      disabled={refining || !instruction.trim()}
                      className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                    >
                      {refining ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                      {refining ? "Re-rendering..." : `Re-render (${s.durationSeconds + 2} credits)`}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingId(null); setInstruction(""); }}
                      className="flex h-9 items-center rounded-lg border-2 border-black/10 px-3 text-xs font-semibold text-text-primary hover:bg-bg-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setEditingId(s.id); setInstruction(s.editInstructions ?? ""); }}
                    disabled={s.status === "GENERATING_VIDEO" || s.status === "COMPOSITING"}
                    className="flex h-9 items-center gap-1 rounded-lg border-2 border-primary/20 bg-primary/5 px-3 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    Edit with instruction
                  </button>
                  {s.status === "FAILED" && (
                    <button
                      type="button"
                      onClick={() => { setEditingId(s.id); setInstruction("retry this scene"); }}
                      className="flex h-9 items-center gap-1 rounded-lg border-2 border-danger/20 bg-danger/5 px-3 text-xs font-semibold text-danger hover:bg-danger/10"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Retry
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
