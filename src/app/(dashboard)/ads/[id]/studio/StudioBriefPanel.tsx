"use client";

import { useState } from "react";
import { Loader2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { MultiFileUpload } from "@/components/ui/MultiFileUpload";
import { AIRephraseField } from "@/components/ui/AIRephraseField";

type BriefAd = {
  id: string;
  status: string;
  productName: string | null;
  productOffer: string | null;
  productImages: string[];
  script: string | null;
  headline: string | null;
  bodyText: string | null;
  callToAction: string | null;
  visualInstructions: string | null;
  aspectRatio: string;
  actor: { id: string; name: string; thumbnailUrl: string | null; imageUrl: string } | null;
};

/**
 * Editable brief panel — visible in Studio above the Scenes panel.
 * Only writeable while ad.status === "DRAFT". Shows fields read-only otherwise.
 */
export function StudioBriefPanel({ initialAd }: { initialAd: BriefAd }) {
  const router = useRouter();
  const { success, error } = useToast();
  const [ad, setAd] = useState<BriefAd>(initialAd);
  const [productName, setProductName] = useState(ad.productName ?? "");
  const [productOffer, setProductOffer] = useState(ad.productOffer ?? "");
  const [productImages, setProductImages] = useState<string[]>(ad.productImages);
  const [script, setScript] = useState(ad.script ?? "");
  const [headline, setHeadline] = useState(ad.headline ?? "");
  const [bodyText, setBodyText] = useState(ad.bodyText ?? "");
  const [callToAction, setCallToAction] = useState(ad.callToAction ?? "");
  const [visualInstructions, setVisualInstructions] = useState(ad.visualInstructions ?? "");
  const [aspectRatio, setAspectRatio] = useState(ad.aspectRatio);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const isDraft = ad.status === "DRAFT";
  const dirty =
    productName !== (ad.productName ?? "") ||
    productOffer !== (ad.productOffer ?? "") ||
    JSON.stringify(productImages) !== JSON.stringify(ad.productImages) ||
    script !== (ad.script ?? "") ||
    headline !== (ad.headline ?? "") ||
    bodyText !== (ad.bodyText ?? "") ||
    callToAction !== (ad.callToAction ?? "") ||
    visualInstructions !== (ad.visualInstructions ?? "") ||
    aspectRatio !== ad.aspectRatio;

  async function save() {
    if (!dirty) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName || null,
          productOffer: productOffer || null,
          productImageUrls: productImages,
          script,
          headline,
          bodyText,
          callToAction,
          visualInstructions,
          aspectRatio,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setAd({
        ...ad,
        productName, productOffer, productImages,
        script, headline, bodyText, callToAction, visualInstructions, aspectRatio,
      });
      success("Brief updated");
      // Refresh server data so the StudioClient picks up changes if it re-renders
      router.refresh();
    } catch (err) {
      error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-6 rounded-3xl border border-black/5 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {ad.actor?.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.actor.thumbnailUrl} alt="" className="h-9 w-9 rounded-lg object-cover flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg font-bold text-text-primary">Brief</h2>
            <p className="text-xs text-text-secondary truncate">
              {isDraft
                ? "Edit anything. Save, then scroll to Scenes to review and start generation."
                : "Read-only — generation has started."}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-text-secondary" /> : <ChevronDown className="h-5 w-5 text-text-secondary" />}
      </button>

      {expanded && (
        <div className={`px-5 pb-5 space-y-4 ${isDraft ? "" : "opacity-75 pointer-events-none"}`}>
          {/* Actor row */}
          {ad.actor && (
            <div className="flex items-center gap-3 rounded-xl bg-bg-secondary/40 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ad.actor.thumbnailUrl ?? ad.actor.imageUrl} alt={ad.actor.name} className="h-12 w-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Actor</div>
                <div className="font-semibold text-text-primary">{ad.actor.name}</div>
              </div>
              {isDraft && (
                <span className="text-[10px] text-text-secondary">Actor swap coming soon — start a new ad to change.</span>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-secondary">Product name</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                disabled={!isDraft}
                className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary disabled:bg-bg-secondary/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-secondary">Offer</label>
              <input
                type="text"
                value={productOffer}
                onChange={(e) => setProductOffer(e.target.value)}
                disabled={!isDraft}
                className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary disabled:bg-bg-secondary/40"
              />
            </div>
          </div>

          {isDraft ? (
            <AIRephraseField
              kind="textarea"
              label="Script"
              hint={`${script.length} chars · ~${Math.round(script.split(/\s+/).filter(Boolean).length / 2.5)}s read time`}
              value={script}
              onChange={setScript}
              fieldType="script"
              rows={6}
              maxLength={2000}
              businessContext={productName ? `Product: ${productName}${productOffer ? ` (Offer: ${productOffer})` : ""}` : undefined}
            />
          ) : (
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-secondary">Script</label>
              <p className="rounded-xl bg-bg-secondary p-3 text-sm whitespace-pre-wrap">{script || "—"}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-secondary">Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                disabled={!isDraft}
                maxLength={100}
                className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary disabled:bg-bg-secondary/40"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-secondary">Body / caption</label>
              <input
                type="text"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                disabled={!isDraft}
                maxLength={500}
                className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary disabled:bg-bg-secondary/40"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-secondary">CTA</label>
              <input
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                disabled={!isDraft}
                maxLength={50}
                className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary disabled:bg-bg-secondary/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-secondary">Aspect ratio</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["9:16", "1:1", "16:9"] as const).map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    disabled={!isDraft}
                    onClick={() => setAspectRatio(ar)}
                    className={`rounded-lg border-2 py-2 text-xs font-semibold transition-all ${aspectRatio === ar ? "border-primary bg-primary/5 text-primary" : "border-black/10 text-text-secondary"} disabled:opacity-50`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isDraft ? (
            <AIRephraseField
              kind="textarea"
              label="Visual instructions / Prompts"
              value={visualInstructions}
              onChange={setVisualInstructions}
              fieldType="imagePrompt"
              rows={3}
              maxLength={500}
            />
          ) : (
            visualInstructions && (
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-secondary">Visual instructions</label>
                <p className="rounded-xl bg-bg-secondary p-3 text-sm">{visualInstructions}</p>
              </div>
            )
          )}

          {isDraft && (
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-secondary">Product photos ({productImages.length})</label>
              <MultiFileUpload
                values={productImages}
                onChange={setProductImages}
                label="Add or replace product photos"
                previewSize="md"
                maxFiles={20}
              />
            </div>
          )}

          {isDraft && (
            <div className="sticky bottom-20 md:bottom-2 z-10 flex justify-end pt-2">
              <button
                type="button"
                onClick={save}
                disabled={!dirty || saving}
                className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> {dirty ? "Save changes" : "Saved"}</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
