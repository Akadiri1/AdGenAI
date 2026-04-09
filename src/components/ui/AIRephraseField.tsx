"use client";

import { useState } from "react";
import { Wand2, Lightbulb, Loader2, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type FieldType = "headline" | "body" | "cta" | "script" | "imagePrompt" | "generic";
type Tone = "punchy" | "professional" | "playful" | "urgent" | "empathetic";

type BaseProps = {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  fieldType: FieldType;
  businessContext?: string;
};

type InputProps = BaseProps & { kind?: "input" };
type TextareaProps = BaseProps & { kind: "textarea"; rows?: number };

export function AIRephraseField(props: InputProps | TextareaProps) {
  const { label, hint, value, onChange, placeholder, maxLength, fieldType, businessContext } = props;
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"write" | "rewrite" | null>(null);
  const [tone, setTone] = useState<Tone | "">("");
  const [showTone, setShowTone] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const { error } = useToast();

  async function aiWrite() {
    setLoading(true);
    setAction("write");
    try {
      const res = await fetch("/api/ai/rephrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: businessContext
            ? `Write a new ${fieldType} for this business: ${businessContext}`
            : `Write a new ${fieldType} for an advertisement`,
          fieldType,
          tone: tone || undefined,
          maxLength,
          mode: "generate",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setSuggestion(data.text);
      setShowTone(false);
    } catch (err) {
      error((err as Error).message);
    } finally {
      setLoading(false);
      setAction(null);
    }
  }

  async function rephrase() {
    if (!value.trim()) {
      error("Type something first, then let AI rewrite it");
      return;
    }
    setLoading(true);
    setAction("rewrite");
    try {
      const res = await fetch("/api/ai/rephrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: value,
          fieldType,
          tone: tone || undefined,
          maxLength,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Rewrite failed");
      setSuggestion(data.text);
      setShowTone(false);
    } catch (err) {
      error((err as Error).message);
    } finally {
      setLoading(false);
      setAction(null);
    }
  }

  function accept() {
    if (suggestion) onChange(suggestion);
    setSuggestion(null);
  }

  function reject() {
    setSuggestion(null);
  }

  const TONES: { key: Tone; label: string }[] = [
    { key: "punchy", label: "Punchy" },
    { key: "professional", label: "Pro" },
    { key: "playful", label: "Playful" },
    { key: "urgent", label: "Urgent" },
    { key: "empathetic", label: "Empathetic" },
  ];

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{label}</span>
        <div className="flex items-center gap-1.5">
          {hint && <span className="text-xs text-text-secondary hidden sm:block">{hint}</span>}

          <button
            type="button"
            onClick={() => {
              if (showTone && action === "write") { setShowTone(false); } else { setAction("write"); setShowTone(true); }
            }}
            disabled={loading}
            className="flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-accent transition-all hover:bg-accent/10 disabled:opacity-50"
          >
            {loading && action === "write" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
            {loading && action === "write" ? "Writing..." : "AI Write"}
          </button>

          <button
            type="button"
            onClick={() => {
              if (showTone && action === "rewrite") { setShowTone(false); } else { setAction("rewrite"); setShowTone(true); }
            }}
            disabled={loading}
            className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/10 disabled:opacity-50"
          >
            {loading && action === "rewrite" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
            {loading && action === "rewrite" ? "Rewriting..." : "AI Rewrite"}
          </button>
        </div>
      </div>

      {showTone && !loading && (
        <div className="mb-2 flex flex-wrap gap-1.5 rounded-xl border border-primary/20 bg-primary/5 p-2">
          <span className="self-center text-[10px] font-bold uppercase tracking-wider text-text-secondary">
            {action === "write" ? "Style:" : "Tone:"}
          </span>
          {TONES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => { setTone(t.key); action === "write" ? aiWrite() : rephrase(); }}
              className="rounded-md bg-white border border-black/10 px-2 py-1 text-[10px] font-semibold text-text-primary hover:border-primary hover:text-primary transition-colors"
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setTone(""); action === "write" ? aiWrite() : rephrase(); }}
            className={`rounded-md px-2 py-1 text-[10px] font-semibold text-white ${
              action === "write" ? "bg-accent hover:bg-accent/90" : "bg-primary hover:bg-primary-dark"
            }`}
          >
            Auto
          </button>
        </div>
      )}

      {/* AI suggestion preview — accept or reject */}
      {suggestion && (
        <div className="mb-2 rounded-xl border-2 border-accent/30 bg-accent/5 p-3">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-accent">
            AI suggestion — review before accepting
          </div>
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap mb-3">
            {suggestion}
          </p>
          <div className="flex gap-2">
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
              onClick={() => { action === "write" ? aiWrite() : rephrase(); }}
              disabled={loading}
              className="flex h-8 items-center gap-1 rounded-lg border-2 border-primary/20 bg-primary/5 px-3 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
            >
              <Wand2 className="h-3.5 w-3.5" /> Try again
            </button>
          </div>
        </div>
      )}

      {props.kind === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={props.rows ?? 3}
          maxLength={maxLength}
          placeholder={placeholder}
          className="w-full resize-none rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
        />
      )}
    </div>
  );
}
