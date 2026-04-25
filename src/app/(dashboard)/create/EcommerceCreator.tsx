"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Sparkles, Loader2, Lock, Package,
  User2, Wand2, Clock, Check,
} from "lucide-react";
import Link from "next/link";
import { ProductImageUploader } from "@/components/create/ProductImageUploader";
import { ActorPicker } from "@/components/create/ActorPicker";
import { useToast } from "@/components/ui/Toast";
import { useCredits } from "@/components/CreditsProvider";

type Actor = {
  id: string;
  name: string;
  imageUrl: string;
  vibe: string | null;
  setting: string | null;
};

type Props = {
  isPaid: boolean;
  isFree: boolean;
};

const DURATIONS = [
  { value: 15, label: "15s", desc: "Quick hook + CTA — Reels, TikTok" },
  { value: 30, label: "30s", desc: "Hook → benefit → CTA — Feed ads" },
  { value: 60, label: "60s", desc: "Full story arc — YouTube, FB" },
] as const;

const PLATFORMS = [
  { id: "INSTAGRAM", label: "Instagram" },
  { id: "TIKTOK", label: "TikTok" },
  { id: "FACEBOOK", label: "Facebook" },
  { id: "YOUTUBE", label: "YouTube" },
];

export function EcommerceCreator({ isPaid, isFree }: Props) {
  const router = useRouter();
  const { success, error } = useToast();
  const { refreshCredits } = useCredits();

  const [step, setStep] = useState(1);
  const [productName, setProductName] = useState("");
  const [productOffer, setProductOffer] = useState("");
  const [productImageUrls, setProductImageUrls] = useState<string[]>([]);
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [targetSeconds, setTargetSeconds] = useState<15 | 30 | 60>(15);
  const [platforms, setPlatforms] = useState<string[]>(["INSTAGRAM"]);
  const [generating, setGenerating] = useState(false);

  // Free users skip actor + go straight to prompts
  const totalSteps = isFree ? 2 : 4;

  function togglePlatform(p: string) {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  async function generate() {
    if (!productName.trim()) {
      error("Add a product name first");
      return;
    }
    if (!isFree && !selectedActor) {
      error("Pick an actor");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/generate/ecommerce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          productOffer: productOffer || undefined,
          productImageUrls,
          actorId: selectedActor?.id ?? "free-tier-no-actor",
          platforms,
          targetSeconds,
          language: "en",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.neededCredits) {
          error(`Need ${data.neededCredits} credits — upgrade or buy a pack`);
        } else {
          error(data.error ?? "Generation failed");
        }
        return;
      }
      success(data.message ?? "Ad generating");
      refreshCredits();
      // Free tier: go to a simple prompts viewer; paid: Studio
      router.push(isFree ? `/ads/${data.adId}/prompts` : `/ads/${data.adId}/studio`);
    } catch (err) {
      error((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  function next() { if (step < totalSteps) setStep(step + 1); }
  function prev() { if (step > 1) setStep(step - 1); }

  const cost = isFree ? 0 : targetSeconds + Math.round(targetSeconds / 6) * 3;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary">
          {isFree ? "Generate ad prompts" : "Create your ad"}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {isFree
            ? "Free plan generates copy + scene prompts. Paste them into any AI video tool — or upgrade to Starter to generate the actual video right here."
            : "Upload your product, pick an actor, and AI builds your ad in 60 seconds."}
        </p>
      </div>

      {isFree && (
        <div className="mb-5 rounded-2xl border-2 border-warning/20 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-heading font-bold text-text-primary text-sm mb-1">Free plan: prompts only</div>
              <p className="text-xs text-text-secondary">
                We&apos;ll write your script and visual prompts. Use them in Kling, Veo, Sora, or any AI video tool.
                <Link href="/settings/billing" className="ml-1 font-semibold text-primary hover:underline">Upgrade to Starter ($15)</Link> to generate videos directly here.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex flex-1 items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
              i + 1 <= step ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary"
            }`}>
              {i + 1 < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < totalSteps - 1 && <div className={`h-0.5 flex-1 ${i + 1 < step ? "bg-primary" : "bg-bg-secondary"}`} />}
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-5 sm:p-6 shadow-sm">
        {/* STEP 1: product details */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold text-text-primary">What are you selling?</h2>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Product name</label>
              <input
                type="text" value={productName} onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Heated travel jacket, Soy candle starter pack"
                className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                maxLength={120}
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Current offer / promo <span className="font-normal lowercase text-text-secondary">(optional)</span>
              </label>
              <input
                type="text" value={productOffer} onChange={(e) => setProductOffer(e.target.value)}
                placeholder="e.g. 30% off this week, Buy 2 get 1 free, Free shipping"
                className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                maxLength={200}
              />
            </div>

            <ProductImageUploader urls={productImageUrls} onChange={setProductImageUrls} />
            <p className="text-[11px] text-text-secondary">
              {isFree
                ? "Optional on Free — but uploading at least one image makes the prompts more specific."
                : "Highly recommended. Multiple angles let AI naturally place your product in scenes."}
            </p>
          </div>
        )}

        {/* STEP 2 (paid): actor */}
        {step === 2 && !isFree && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <User2 className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold text-text-primary">Who&apos;s in your ad?</h2>
            </div>
            <p className="text-sm text-text-secondary">Pick a stock actor — or {isPaid ? "upload your own face" : "upgrade to Pro to upload custom actors"}.</p>
            <ActorPicker selectedId={selectedActor?.id ?? null} onSelect={setSelectedActor} />
          </div>
        )}

        {/* STEP 3 (paid) / STEP 2 (free): platforms + duration + generate */}
        {((step === 3 && !isFree) || (step === 2 && isFree)) && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold text-text-primary">Format & length</h2>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Length</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setTargetSeconds(d.value as 15 | 30 | 60)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      targetSeconds === d.value ? "border-primary bg-primary/5" : "border-black/10 hover:border-black/20"
                    }`}
                  >
                    <div className="font-heading font-bold text-text-primary">{d.label}</div>
                    <div className="text-[10px] text-text-secondary">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`rounded-xl border-2 px-3 py-1.5 text-xs font-semibold transition-all ${
                      platforms.includes(p.id) ? "border-primary bg-primary/5 text-primary" : "border-black/10 text-text-secondary hover:border-black/20"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 (paid): summary + generate */}
        {step === 4 && !isFree && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold text-text-primary">Ready to generate</h2>
            </div>

            <div className="rounded-2xl bg-bg-secondary/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text-secondary">Product</span><span className="font-semibold text-text-primary">{productName}</span></div>
              {productOffer && <div className="flex justify-between"><span className="text-text-secondary">Offer</span><span className="font-semibold text-text-primary">{productOffer}</span></div>}
              <div className="flex justify-between"><span className="text-text-secondary">Images</span><span className="font-semibold text-text-primary">{productImageUrls.length}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Actor</span><span className="font-semibold text-text-primary">{selectedActor?.name ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Length</span><span className="font-semibold text-text-primary">{targetSeconds}s</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Platforms</span><span className="font-semibold text-text-primary">{platforms.join(", ")}</span></div>
              <hr className="border-black/10" />
              <div className="flex justify-between"><span className="text-text-secondary">Cost</span><span className="font-heading font-bold text-primary">{cost} credits</span></div>
            </div>

            <p className="text-xs text-text-secondary">
              We&apos;ll plan the script, composite your product with {selectedActor?.name}, and start rendering. You can edit any scene with natural-language instructions in Studio.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={prev}
              className="flex h-10 items-center gap-1 rounded-xl border-2 border-black/10 px-4 text-sm font-semibold text-text-primary hover:bg-bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : <div />}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={next}
              disabled={
                (step === 1 && !productName.trim()) ||
                (step === 2 && !isFree && !selectedActor)
              }
              className="flex h-10 items-center gap-1 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={generate}
              disabled={generating || !productName.trim()}
              className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-warning px-6 text-sm font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {generating
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                : isFree
                  ? <><Wand2 className="h-4 w-4" /> Generate prompts</>
                  : <><Sparkles className="h-4 w-4" /> Generate ad ({cost} credits)</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
