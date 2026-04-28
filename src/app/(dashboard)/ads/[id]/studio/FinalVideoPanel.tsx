"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Download, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useCredits } from "@/components/CreditsProvider";
import { useConfirm } from "@/components/ui/ConfirmModal";

type Scene = {
  sceneNumber: number;
  finalClipUrl: string | null;
  videoClipUrl: string | null;
};

type FinalState = {
  videoUrl: string | null;
  finalVideoStatus: string | null;
  finalVideoError: string | null;
  allScenesReady: boolean;
  sceneCount: number;
};

export function FinalVideoPanel({ adId }: { adId: string }) {
  const { error, success } = useToast();
  const { refreshCredits } = useCredits();
  const confirm = useConfirm();
  const [state, setState] = useState<FinalState | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [starting, setStarting] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const [finRes, sceneRes] = await Promise.all([
          fetch(`/api/ads/${adId}/finalize`, { cache: "no-store" }),
          fetch(`/api/ads/${adId}/scenes`, { cache: "no-store" }),
        ]);
        if (!finRes.ok || !sceneRes.ok) return;
        const finData = await finRes.json();
        const sceneData = await sceneRes.json();
        if (cancelled) return;
        setState(finData);
        const clips: Scene[] = (sceneData.scenes ?? [])
          .filter((s: Scene) => s.finalClipUrl || s.videoClipUrl)
          .map((s: Scene) => ({
            sceneNumber: s.sceneNumber,
            finalClipUrl: s.finalClipUrl,
            videoClipUrl: s.videoClipUrl,
          }));
        setScenes(clips);
      } catch { /* swallow */ }
    }
    tick();
    const id = setInterval(tick, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [adId]);

  // Derive clips before the early return so the autoplay useEffect can
  // reference currentClip unconditionally (Rules of Hooks — no hooks after returns)
  const clips = scenes.map(s => ({ url: (s.finalClipUrl ?? s.videoClipUrl)!, scene: s.sceneNumber })).filter(c => c.url);
  const currentClip = clips[currentIdx]?.url;

  async function startFinalize() {
    const ok = await confirm({
      title: "Add voiceover + lip-sync?",
      message: `Adds voice to each scene. Charges ${cost} credits, takes 3–5 minutes.`,
      confirmLabel: `Start (${cost}cr)`,
    });
    if (!ok) return;
    setStarting(true);
    try {
      const res = await fetch(`/api/ads/${adId}/finalize`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      success("Lip-sync started — scenes update as each one finishes");
      setState(prev => prev ? { ...prev, finalVideoStatus: "GENERATING" } : prev);
      refreshCredits();
    } catch (err) {
      error((err as Error).message);
    } finally {
      setStarting(false);
    }
  }

  if (!state || !state.allScenesReady) return null;

  const cost = 5 + state.sceneCount * 2;
  const isGenerating = state.finalVideoStatus === "GENERATING";
  const isReady = state.finalVideoStatus === "READY" || scenes.some(s => s.finalClipUrl);
  const isFailed = state.finalVideoStatus === "FAILED";

  function onVideoEnded() {
    if (currentIdx < clips.length - 1) setCurrentIdx(i => i + 1);
  }

  return (
    <div className="mb-6 rounded-3xl border-2 border-success/20 bg-gradient-to-br from-success/5 via-white to-accent/5 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-success" />
          <h2 className="font-heading text-xl font-bold text-text-primary">Final video</h2>
        </div>
        {clips.length > 1 && (
          <div className="flex gap-1.5">
            {clips.map((_, i) => (
              <button key={i} onClick={() => setCurrentIdx(i)}
                className={`h-2 rounded-full transition-all ${i === currentIdx ? "w-6 bg-primary" : "w-2 bg-black/20"}`}
              />
            ))}
          </div>
        )}
      </div>

      {isReady && clips.length > 0 ? (
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden bg-black">
            <video ref={videoRef} src={currentClip} controls autoPlay onEnded={onVideoEnded}
              className="w-full max-h-[600px]" />
          </div>
          {clips.length > 1 && (
            <p className="text-[11px] text-text-secondary text-center">
              Scene {currentIdx + 1} of {clips.length} — auto-advances to next scene
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {clips.map((c, i) => (
              <a key={i} href={c.url} download
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-bold text-white hover:bg-primary-dark">
                <Download className="h-4 w-4" /> Download Scene {c.scene}
              </a>
            ))}
          </div>
          <button type="button" onClick={startFinalize} disabled={starting || isGenerating}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border-2 border-black/10 bg-white text-xs font-semibold text-text-primary hover:bg-bg-secondary disabled:opacity-50">
            {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Re-render lip-sync ({cost}cr)
          </button>
        </div>
      ) : isGenerating || starting ? (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
          <div className="flex items-center gap-2 font-semibold text-accent">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating voiceover + lip-sync for each scene...
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Each scene takes 1–2 min. Scene cards above update as each one finishes.
          </p>
        </div>
      ) : isFailed ? (
        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-danger/30 bg-danger/5 p-4">
            <div className="flex items-center gap-2 font-semibold text-danger mb-1">
              <AlertCircle className="h-4 w-4" /> Finalization failed
            </div>
            <p className="text-xs text-text-secondary">{state.finalVideoError ?? "Unknown error"}</p>
          </div>
          <button type="button" onClick={startFinalize} disabled={starting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50">
            Retry ({cost}cr)
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">
            All {state.sceneCount} scenes ready. Add voiceover and lip-sync to bring them to life.
          </p>
          <button type="button" onClick={startFinalize} disabled={starting}
            className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-success px-5 text-sm font-bold text-white shadow-lg hover:bg-success/90 disabled:opacity-50 whitespace-nowrap">
            {starting ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting...</> : <><Sparkles className="h-4 w-4" /> Add Voice + Lip-sync ({cost}cr)</>}
          </button>
        </div>
      )}
    </div>
  );
}
