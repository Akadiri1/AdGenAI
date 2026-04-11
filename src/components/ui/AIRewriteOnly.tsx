"use client";

import { useState } from "react";
import { Wand2, Loader2, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

/**
 * AI Polish — returns a button and a suggestion panel that the parent
 * places independently (button next to label, panel below the field).
 */
export function useAIRewrite({
  value,
  onChange,
  fieldType = "generic",
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  fieldType?: string;
  maxLength?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const { error } = useToast();

  async function rewrite() {
    if (!value.trim()) {
      error("Write something first — AI can only polish what you've written");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/rephrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value, fieldType, maxLength }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Rewrite failed");
      setSuggestion(data.text);
    } catch (err) {
      error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function accept() {
    if (suggestion) onChange(suggestion);
    setSuggestion(null);
  }

  function reject() {
    setSuggestion(null);
  }

  const button = (
    <button
      type="button"
      onClick={rewrite}
      disabled={loading || !value.trim()}
      className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed"
      title={value.trim() ? "AI polishes your text" : "Write something first"}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
      {loading ? "Polishing..." : "AI Polish"}
    </button>
  );

  const panel = suggestion ? (
    <div className="mt-2 rounded-xl border-2 border-accent/40 bg-accent/5 p-3">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-accent">
        AI suggestion — review before accepting
      </div>
      <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap mb-3">
        {suggestion}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={accept}
          className="flex h-8 items-center gap-1 rounded-lg bg-success px-3 text-xs font-semibold text-white hover:bg-success/90 transition-colors"
        >
          <Check className="h-3.5 w-3.5" /> Accept
        </button>
        <button
          type="button"
          onClick={reject}
          className="flex h-8 items-center gap-1 rounded-lg border-2 border-black/10 bg-white px-3 text-xs font-semibold text-text-primary hover:bg-bg-secondary transition-colors"
        >
          <X className="h-3.5 w-3.5" /> Reject
        </button>
        <button
          type="button"
          onClick={rewrite}
          disabled={loading}
          className="flex h-8 items-center gap-1 rounded-lg border-2 border-primary/20 bg-primary/5 px-3 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
        >
          <Wand2 className="h-3.5 w-3.5" /> Try again
        </button>
      </div>
    </div>
  ) : null;

  return { button, panel };
}

/**
 * Backwards-compatible wrapper. Renders just the button — for places that
 * don't need the suggestion panel inline (the panel won't appear).
 * Prefer `useAIRewrite` for proper layout.
 */
export function AIRewriteOnly(props: Parameters<typeof useAIRewrite>[0]) {
  const { button } = useAIRewrite(props);
  return button;
}
