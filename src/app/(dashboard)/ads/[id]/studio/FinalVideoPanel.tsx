"use client";

import { useEffect, useState } from "react";
import { Loader2, Play, Download, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useCredits } from "@/components/CreditsProvider";

type FinalState = {
  videoUrl: string | null;
  finalVideoStatus: string | null; // null | "GENERATING" | "READY" | "FAILED"
  finalVideoError: string | null;
  allScenesReady: boolean;
  sceneCount: number;
};

/**
 * Shown in Studio under the Scenes section once every scene clip is READY.
 * Triggers POST /api/ads/[id]/finalize which:
 *   1. TTS the spoken script
 *   2. concat scene clips
 *   3. lipsync against the voiceover
 *   4. uploads final MP4 to R2
 */
export function FinalVideoPanel({ adId }: { adId: string }) {
  const { error, success } = useToast();
  const { refreshCredits } = useCredits();
  const [state, setState] = useState<FinalState | null>(null);
  const [starting, setStarting] = useState(false);

  // Poll the same /scenes endpoint — it returns adStatus, but we also need
  // finalVideoStatus + videoUrl. We hit the dedicated GET below.
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch(`/api/ads/${adId}/finalize`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setState(data);
      } catch { /* swallow */ }
    }
    tick();
    const id = setInterval(tick, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [adId]);

  if (!state || !state.allScenesReady) return null;

  const cost = 5 + state.sceneCount * 2;
  const isGenerating = state.finalVideoStatus === "GENERATING";
  const isReady = state.finalVideoStatus === "READY" && !!state.videoUrl;
  const isFailed = state.finalVideoStatus === "FAILED";

  async function startFinalize() {
    if (!confirm(`Render the final stitched ad? This will charge ${cost} credits.`)) return;
    setStarting(true);
    try {
      const res = await fetch(`/api/ads/${adId}/finalize`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Finalize failed");
      success(`Final video ready — ${data.creditsCharged} credits charged`);
      setState({ ...state!, videoUrl: data.videoUrl, finalVideoStatus: "READY", finalVideoError: null });
      refreshCredits();
    } catch (err) {
      error((err as Error).message);
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="mb-6 rounded-3xl border-2 border-success/20 bg-gradient-to-br from-success/5 via-white to-accent/5 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-success" />
        <h2 className="font-heading text-xl font-bold text-text-primary">Final video</h2>
      </div>

      {isReady && state.videoUrl ? (
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden bg-black">
            <video src={state.videoUrl} controls className="w-full max-h-[600px]" />
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={state.videoUrl}
              download
              className="flex h-10 flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white hover:bg-primary-dark"
            >
              <Download className="h-4 w-4" /> Download MP4
            </a>
            <button
              type="button"
              onClick={startFinalize}
              disabled={starting}
              className="flex h-10 flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl border-2 border-black/10 bg-white px-4 text-sm font-semibold text-text-primary hover:bg-bg-secondary disabled:opacity-50"
            >
              {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Re-render <span className="opacity-70">({cost}cr)</span>
            </button>
          </div>
        </div>
      ) : isGenerating || starting ? (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
          <div className="flex items-center gap-2 font-semibold text-accent">
            <Loader2 className="h-4 w-4 animate-spin" />
            Stitching scenes, generating voiceover, and lip-syncing...
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            This usually takes 60–120 seconds. We&apos;ll update this panel when it&apos;s ready.
          </p>
        </div>
      ) : isFailed ? (
        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-danger/30 bg-danger/5 p-4">
            <div className="flex items-center gap-2 font-semibold text-danger mb-1">
              <AlertCircle className="h-4 w-4" /> Finalization failed
            </div>
            <p className="text-xs text-text-secondary break-words">{state.finalVideoError ?? "Unknown error"}</p>
          </div>
          <button
            type="button"
            onClick={startFinalize}
            disabled={starting}
            className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Retry ({cost} credits)
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-secondary">
            All {state.sceneCount} scenes are ready. Render the final ad with voiceover and lip-sync — <strong className="text-text-primary">~2 min</strong>.
          </p>
          <button
            type="button"
            onClick={startFinalize}
            disabled={starting}
            className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-success px-4 sm:px-5 text-sm font-bold text-white shadow-lg hover:bg-success/90 disabled:opacity-50"
          >
            {starting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Starting...</>
            ) : (
              <><Play className="h-4 w-4" /> Render Final Video <span className="opacity-80">({cost}cr)</span></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
