"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Sparkles, Crown } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type Scene = {
  id: string;
  sceneNumber: number;
  prompt: string;
  spokenLine: string | null;
};

type Ad = {
  id: string;
  productName: string;
  productOffer: string | null;
  headline: string | null;
  bodyText: string | null;
  callToAction: string | null;
  script: string | null;
  musicGenre: string | null;
  scenes: Scene[];
};

export function PromptsViewer({ ad }: { ad: Ad }) {
  const { success } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    success("Copied");
    setTimeout(() => setCopiedKey(null), 1500);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/ads" className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> My Ads
      </Link>

      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
          <Sparkles className="h-3 w-3" /> Free plan — prompts only
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary">{ad.productName}</h1>
        {ad.productOffer && <p className="text-text-secondary mt-1">{ad.productOffer}</p>}
      </div>

      {/* Upgrade CTA */}
      <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-warning/10 to-accent/10 p-5">
        <div className="flex items-start gap-3">
          <Crown className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-heading font-bold text-text-primary mb-1">Want the actual video?</div>
            <p className="text-sm text-text-secondary mb-3">
              Starter generates this same plan as a real video — actor + product + music — ready to post. $15/month for 40 seconds.
            </p>
            <Link href="/settings/billing" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-white hover:bg-primary-dark">
              Upgrade to Starter
            </Link>
          </div>
        </div>
      </div>

      {/* Ad copy */}
      {ad.headline && (
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm space-y-3">
          <h2 className="font-heading text-lg font-bold text-text-primary">Ad copy</h2>
          <Field label="Headline" value={ad.headline} onCopy={() => copy(ad.headline!, "headline")} copied={copiedKey === "headline"} />
          {ad.bodyText && <Field label="Body / caption" value={ad.bodyText} onCopy={() => copy(ad.bodyText!, "body")} copied={copiedKey === "body"} multiline />}
          {ad.callToAction && <Field label="CTA" value={ad.callToAction} onCopy={() => copy(ad.callToAction!, "cta")} copied={copiedKey === "cta"} />}
        </div>
      )}

      {/* Spoken script */}
      {ad.script && (
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-text-primary">Full spoken script</h2>
            <CopyBtn onClick={() => copy(ad.script!, "script")} copied={copiedKey === "script"} />
          </div>
          <p className="whitespace-pre-wrap text-sm text-text-primary leading-relaxed">{ad.script}</p>
        </div>
      )}

      {/* Scene-by-scene */}
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-text-primary mb-1">Scene-by-scene prompts</h2>
        <p className="text-xs text-text-secondary mb-4">Paste each prompt into Kling, Veo, Sora, or any AI video tool. Generate your scenes, then stitch them together.</p>
        <div className="space-y-3">
          {ad.scenes.map((s) => (
            <div key={s.id} className="rounded-xl border border-black/5 bg-bg-secondary/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-heading text-sm font-bold text-text-primary">Scene {s.sceneNumber}</div>
              </div>
              {s.spokenLine && (
                <div className="mb-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Spoken line</div>
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-sm italic text-text-primary">&ldquo;{s.spokenLine}&rdquo;</p>
                    <CopyBtn onClick={() => copy(s.spokenLine!, `line-${s.id}`)} copied={copiedKey === `line-${s.id}`} />
                  </div>
                </div>
              )}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Visual prompt</div>
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-xs text-text-secondary leading-relaxed">{s.prompt}</p>
                  <CopyBtn onClick={() => copy(s.prompt, `prompt-${s.id}`)} copied={copiedKey === `prompt-${s.id}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {ad.musicGenre && (
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-text-primary mb-2">Recommended music</h2>
          <p className="text-sm text-text-secondary">Genre: <strong className="text-text-primary">{ad.musicGenre}</strong></p>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onCopy, copied, multiline,
}: {
  label: string; value: string; onCopy: () => void; copied: boolean; multiline?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{label}</div>
        <CopyBtn onClick={onCopy} copied={copied} />
      </div>
      <div className={`rounded-lg bg-bg-secondary px-3 py-2 text-sm text-text-primary ${multiline ? "whitespace-pre-wrap leading-relaxed" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function CopyBtn({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
        copied ? "bg-success text-white" : "bg-bg-secondary text-text-secondary hover:bg-black/10"
      }`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
