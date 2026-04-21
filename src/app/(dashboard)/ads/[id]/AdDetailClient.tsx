"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Lock, Sparkles, Film, Trash2, SlidersHorizontal, Download } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Watermark } from "@/components/Logo";
import { useAIRewrite } from "@/components/ui/AIRewriteOnly";

type Ad = {
  id: string;
  type: string;
  status: string;
  headline: string | null;
  bodyText: string | null;
  callToAction: string | null;
  script: string | null;
  scriptFramework: string | null;
  images: string[] | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  musicGenre: string | null;
  aspectRatio: string;
  language: string;
  score: number | null;
  platform: string[];
  scheduledAt: string | null | undefined;
  postedAt: string | null;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
};

export function AdDetailClient({
  ad: initialAd,
  canEdit,
}: {
  ad: Ad;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [ad, setAd] = useState(initialAd);
  const [editing, setEditing] = useState<"copy" | "image" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [draft, setDraft] = useState({
    headline: ad.headline ?? "",
    bodyText: ad.bodyText ?? "",
    callToAction: ad.callToAction ?? "",
  });
  const [imagePrompt, setImagePrompt] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleValue, setScheduleValue] = useState("");
  const { success, error: toastError } = useToast();

  const isLocked = ad.status === "POSTED" || ad.status === "POSTING";

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/ads/${ad.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      success("Ad deleted");
      router.push("/ads");
    } catch (err) {
      toastError((err as Error).message);
      setDeleting(false);
    }
  }

  function downloadAd() {
    const url = ad.videoUrl ?? ad.thumbnailUrl;
    if (!url) { toastError("No media to download"); return; }
    const a = document.createElement("a");
    a.href = url;
    a.download = `famousli-${ad.id}.${ad.videoUrl ? "mp4" : "png"}`;
    a.click();
  }

  const aspectClass =
    ad.aspectRatio === "9:16" ? "aspect-[9/16]"
    : ad.aspectRatio === "16:9" ? "aspect-[16/9]"
    : ad.aspectRatio === "4:5" ? "aspect-[4/5]"
    : "aspect-square";

  async function saveCopy() {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setAd({ ...ad, ...draft });
      setEditing(null);
      success("Copy updated");
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function regenerateImage() {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(customImageUrl
            ? { customImageUrl }
            : { regenerateImage: true, newImagePrompt: imagePrompt }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Image update failed");
      setAd({ ...ad, thumbnailUrl: data.ad.thumbnailUrl, videoUrl: null });
      setEditing(null);
      setImagePrompt("");
      setCustomImageUrl("");
      success("Image updated");
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleSchedule(postNow: boolean) {
    setScheduling(true);
    try {
      const res = await fetch(`/api/ads/${ad.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postNow,
          scheduledAt: !postNow && scheduleValue ? new Date(scheduleValue).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scheduling failed");
      setAd({ ...ad, status: "SCHEDULED", scheduledAt: data.scheduledAt });
      success(postNow ? "Posting now" : "Scheduled");
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setScheduling(false);
    }
  }

  async function handleGenerateVideo() {
    setGeneratingVideo(true);
    try {
      const res = await fetch(`/api/ads/${ad.id}/video`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Video generation failed");
      setAd({ ...ad, videoUrl: data.videoUrl, type: "VIDEO" });
      success("Video assembled");
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setGeneratingVideo(false);
    }
  }

  const editingCopy = editing === "copy";
  const editingImage = editing === "image";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/ads"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white hover:bg-bg-secondary transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold text-text-primary">{ad.headline ?? "Untitled ad"}</h1>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="rounded-md bg-bg-secondary px-2 py-0.5 text-xs font-semibold">{ad.status}</span>
            {ad.score !== null && <span>Score: <strong>{Math.round(ad.score)}/100</strong></span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit ? (
            <Link
              href={`/ads/${ad.id}/studio`}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" /> Open in Studio
            </Link>
          ) : (
            <Link
              href="/settings/billing"
              className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-warning/30 bg-warning/5 px-4 text-sm font-semibold text-warning hover:bg-warning/10 transition-colors"
            >
              <Lock className="h-4 w-4" /> Upgrade to edit
            </Link>
          )}
          <button
            onClick={downloadAd}
            className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-black/10 bg-white px-3 text-sm font-semibold text-text-primary hover:bg-bg-secondary transition-colors"
            title="Download ad"
          >
            <Download className="h-4 w-4" />
          </button>
          {confirmDelete ? (
            <>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex h-10 items-center gap-1.5 rounded-xl bg-danger px-3 text-sm font-semibold text-white hover:bg-danger/90 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> {deleting ? "..." : "Confirm"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex h-10 items-center rounded-xl border-2 border-black/10 bg-white px-3 text-sm font-semibold text-text-primary hover:bg-bg-secondary"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-danger/20 bg-danger/5 px-3 text-sm font-semibold text-danger hover:bg-danger/10 transition-colors"
              title="Delete ad"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading font-bold text-text-primary">Preview</h2>
              {!isLocked && (
                canEdit ? (
                  <button
                    onClick={() => setEditing(editingImage ? null : "image")}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Change image
                  </button>
                ) : (
                  <Link href="/settings/billing" className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary">
                    <Lock className="h-3.5 w-3.5" /> Upgrade to edit
                  </Link>
                )
              )}
            </div>

            <div className={`relative mx-auto max-w-md ${aspectClass} overflow-hidden rounded-2xl bg-bg-secondary shadow-lg`}>
              {ad.videoUrl ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={ad.videoUrl} controls className="h-full w-full object-cover" />
              ) : ad.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ad.thumbnailUrl} alt={ad.headline ?? "Ad"} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center"><Film className="h-10 w-10 text-text-secondary" /></div>
              )}

              {ad.headline && (
                <div className="absolute left-0 right-0 top-4 px-4 text-center">
                  <div className="inline-block rounded-lg bg-black/60 px-3 py-1.5 font-heading font-bold text-white backdrop-blur-sm">
                    {ad.headline}
                  </div>
                </div>
              )}
              {ad.callToAction && (
                <div className="absolute bottom-4 left-0 right-0 px-4 text-center">
                  <div className="inline-block rounded-lg bg-primary px-4 py-2 font-heading text-sm font-bold text-white shadow-lg">
                    {ad.callToAction}
                  </div>
                </div>
              )}
              {!canEdit && (
                <div className="absolute bottom-2 right-2">
                  <Watermark />
                </div>
              )}
            </div>

            {editingImage && canEdit && (
              <div className="mt-4 space-y-3 rounded-2xl border-2 border-primary/20 bg-primary/5 p-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Custom image URL
                  </label>
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => { setCustomImageUrl(e.target.value); setImagePrompt(""); }}
                    placeholder="https://..."
                    className="w-full rounded-lg border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="text-center text-[10px] font-bold uppercase text-text-secondary">or</div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    AI regenerate prompt
                  </label>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => { setImagePrompt(e.target.value); setCustomImageUrl(""); }}
                    rows={2}
                    placeholder="A different angle of..."
                    className="w-full resize-none rounded-lg border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={regenerateImage}
                    disabled={savingEdit || (!imagePrompt && !customImageUrl)}
                    className="flex flex-1 h-10 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {savingEdit ? "Updating..." : "Update image"}
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="h-10 rounded-xl border-2 border-black/10 px-4 text-sm font-semibold text-text-primary hover:bg-bg-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {ad.script && (
            <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-heading font-bold text-text-primary">Video Script</h2>
                {ad.scriptFramework && (
                  <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                    {ad.scriptFramework}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-text-secondary leading-relaxed">{ad.script}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-heading font-bold text-text-primary">Copy</h3>
              {!isLocked && !editingCopy && (
                canEdit ? (
                  <button
                    onClick={() => {
                      setDraft({
                        headline: ad.headline ?? "",
                        bodyText: ad.bodyText ?? "",
                        callToAction: ad.callToAction ?? "",
                      });
                      setEditing("copy");
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                ) : (
                  <Link href="/settings/billing" className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary">
                    <Lock className="h-3.5 w-3.5" /> Pro
                  </Link>
                )
              )}
            </div>

            {editingCopy && canEdit ? (
              <div className="space-y-3 text-sm">
                <PolishedField
                  label="Headline"
                  value={draft.headline}
                  onChange={(v) => setDraft({ ...draft, headline: v })}
                  fieldType="headline"
                  maxLength={100}
                />
                <PolishedField
                  label="Body"
                  value={draft.bodyText}
                  onChange={(v) => setDraft({ ...draft, bodyText: v })}
                  fieldType="body"
                  multiline rows={3}
                  maxLength={500}
                />
                <PolishedField
                  label="CTA"
                  value={draft.callToAction}
                  onChange={(v) => setDraft({ ...draft, callToAction: v })}
                  fieldType="cta"
                  maxLength={50}
                />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveCopy}
                    disabled={savingEdit}
                    className="flex flex-1 h-9 items-center justify-center gap-1 rounded-lg bg-primary text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> {savingEdit ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="flex h-9 items-center justify-center gap-1 rounded-lg border-2 border-black/10 px-3 text-xs font-semibold text-text-primary hover:bg-bg-secondary"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Headline</div>
                  <div className="text-text-primary">{ad.headline ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Body</div>
                  <div className="text-text-primary">{ad.bodyText ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">CTA</div>
                  <div className="text-text-primary">{ad.callToAction ?? "—"}</div>
                </div>
              </div>
            )}

            {!canEdit && !isLocked && (
              <div className="mt-4 rounded-xl bg-warning/10 border border-warning/20 p-3 text-xs text-text-primary">
                <div className="flex items-center gap-1.5 font-semibold text-warning mb-1">
                  <Lock className="h-3 w-3" /> Editing is a Pro feature
                </div>
                <Link href="/settings/billing" className="text-primary font-semibold hover:underline">
                  Upgrade to edit ads →
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <h3 className="font-heading font-bold text-text-primary mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-secondary">Aspect ratio</dt>
                <dd className="font-semibold text-text-primary">{ad.aspectRatio}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Language</dt>
                <dd className="font-semibold text-text-primary">{ad.language}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Music genre</dt>
                <dd className="font-semibold text-text-primary">{ad.musicGenre ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-text-secondary mb-1">Platforms</dt>
                <dd className="flex flex-wrap gap-1">
                  {ad.platform.map((p) => (
                    <span key={p} className="rounded bg-bg-secondary px-1.5 py-0.5 text-[10px] font-semibold">
                      {p}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <h3 className="font-heading font-bold text-text-primary mb-3">Schedule & Post</h3>
            {ad.status === "POSTED" ? (
              <div className="rounded-xl bg-success/10 p-3 text-sm text-success font-semibold text-center">
                ✅ Posted{ad.postedAt && ` on ${new Date(ad.postedAt).toLocaleDateString()}`}
              </div>
            ) : ad.status === "SCHEDULED" && ad.scheduledAt ? (
              <div className="rounded-xl bg-warning/10 p-3 text-sm text-warning font-semibold text-center">
                ⏰ Scheduled for {new Date(ad.scheduledAt).toLocaleString()}
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handleSchedule(true)}
                  disabled={scheduling}
                  className="h-10 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  {scheduling ? "..." : "Post now"}
                </button>
                <input
                  type="datetime-local"
                  value={scheduleValue}
                  onChange={(e) => setScheduleValue(e.target.value)}
                  className="w-full rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={() => handleSchedule(false)}
                  disabled={scheduling || !scheduleValue}
                  className="h-10 w-full rounded-xl border-2 border-black/10 bg-white text-sm font-semibold text-text-primary hover:bg-bg-secondary disabled:opacity-50"
                >
                  Schedule
                </button>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
            <h3 className="font-heading font-bold text-text-primary mb-3">Performance</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-text-secondary">Impressions</dt><dd className="font-semibold">{ad.impressions.toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt className="text-text-secondary">Clicks</dt><dd className="font-semibold">{ad.clicks.toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt className="text-text-secondary">Conversions</dt><dd className="font-semibold">{ad.conversions.toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt className="text-text-secondary">Spend</dt><dd className="font-semibold">${ad.spend.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-text-secondary">Revenue</dt><dd className="font-semibold">${ad.revenue.toFixed(2)}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolishedField({
  label, value, onChange, fieldType, maxLength, multiline = false, rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  fieldType: string;
  maxLength: number;
  multiline?: boolean;
  rows?: number;
}) {
  const { button, panel } = useAIRewrite({ value, onChange, fieldType, maxLength });
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{label}</span>
        {button}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          maxLength={maxLength}
          className="w-full resize-none rounded-lg border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          className="w-full rounded-lg border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        />
      )}
      {panel}
    </div>
  );
}
