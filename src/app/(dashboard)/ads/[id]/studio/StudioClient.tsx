"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft, Download, Send, Clock, Save, SlidersHorizontal,
  Image as ImageIcon, Music, Languages, Palette, Type,
  Sparkles, Upload, Lock, Film, CheckCircle2, BookTemplate, X,
  Users, Copy, Mic, Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { AIRephraseField } from "@/components/ui/AIRephraseField";
import { Watermark } from "@/components/Logo";
import { AVATAR_LIBRARY, SITUATIONS, filterAvatars } from "@/lib/avatars";

type Ad = {
  id: string;
  type: string;
  status: string;
  headline: string | null;
  bodyText: string | null;
  callToAction: string | null;
  script: string | null;
  scriptFramework: string | null;
  images: string[];
  videoUrl: string | null;
  thumbnailUrl: string | null;
  musicGenre: string | null;
  aspectRatio: string;
  language: string;
  score: number | null;
  platform: string[];
};

const LANGUAGES = [
  { code: "en", label: "English" }, { code: "es", label: "Spanish" }, { code: "fr", label: "French" },
  { code: "de", label: "German" }, { code: "pt", label: "Portuguese" }, { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" }, { code: "ja", label: "Japanese" }, { code: "sw", label: "Swahili" },
];

const MUSIC_OPTIONS = [
  "pop", "cinematic", "corporate", "hip-hop", "lo-fi", "electronic",
  "afrobeats", "amapiano", "jazz", "classical", "motivational", "chill",
  "trending-tiktok", "trending-reels",
];

export function StudioClient({
  ad: initialAd,
  variants = [],
  isPaid,
  brandColors,
  brandVoice,
  userLang,
}: {
  ad: Ad;
  variants?: Ad[];
  isPaid: boolean;
  brandColors: { primary: string; secondary: string; accent: string };
  brandVoice: string;
  userLang: string;
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [ad, setAd] = useState(initialAd);
  const hasVariants = variants.length > 1;
  const [activeTab, setActiveTab] = useState<"copy" | "visuals" | "actors" | "music" | "ugc" | "settings">("copy");
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [dirty, setDirty] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    category: "e-commerce",
    isPublic: true,
    isPremium: false,
    price: 5,
  });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoDuration, setVideoDuration] = useState("15s");
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [variantCount, setVariantCount] = useState(5);
  const [varyWhat, setVaryWhat] = useState<"actors" | "scripts" | "both">("both");
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [voiceStability, setVoiceStability] = useState(0.5);
  const [voiceStyle, setVoiceStyle] = useState(0.1);
  const [ugcGenerating, setUgcGenerating] = useState(false);
  const [selectedUgcTemplate, setSelectedUgcTemplate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedActorId, setSelectedActorId] = useState<string>("");
  const [actorScript, setActorScript] = useState<string>("");
  const [actorFilters, setActorFilters] = useState<{ gender: string; age: string; situation: string; search: string }>({
    gender: "", age: "", situation: "", search: "",
  });

  function update<K extends keyof Ad>(key: K, val: Ad[K]) {
    setAd({ ...ad, [key]: val });
    setDirty(true);
  }

  async function save() {
    if (!isPaid) { toastError("Upgrade to edit ads"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: ad.headline,
          bodyText: ad.bodyText,
          callToAction: ad.callToAction,
          script: ad.script,
          scriptFramework: ad.scriptFramework,
          musicGenre: ad.musicGenre,
          aspectRatio: ad.aspectRatio,
          ...(customImageUrl && { customImageUrl }),
          ...(imagePrompt && { regenerateImage: true, newImagePrompt: imagePrompt }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      if (data.ad?.thumbnailUrl) setAd({ ...ad, thumbnailUrl: data.ad.thumbnailUrl, videoUrl: null });
      setDirty(false);
      setCustomImageUrl("");
      setImagePrompt("");
      success("Changes saved");
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSaving(false);
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
          scheduledAt: !postNow && scheduleDate ? new Date(scheduleDate).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      success(postNow ? "Publishing now" : "Scheduled");
      router.push(`/ads/${ad.id}`);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setScheduling(false);
    }
  }

  async function saveAsTemplate() {
    setSavingTemplate(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: ad.id, ...templateForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      success(templateForm.isPublic ? "Template published to marketplace!" : "Template saved!");
      setShowTemplateModal(false);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleGenerateVideo() {
    setGeneratingVideo(true);
    try {
      const res = await fetch(`/api/ads/${ad.id}/video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: videoDuration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Video generation failed");
      setAd({ ...ad, videoUrl: data.videoUrl, type: "VIDEO" });
      success(`${videoDuration} video created`);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setGeneratingVideo(false);
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

  async function generateVariants() {
    setGeneratingVariants(true);
    try {
      const res = await fetch("/api/generate/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceAdId: ad.id, numVariants: variantCount, varyWhat }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      success(`Generated ${data.ads.length} variants! Redirecting...`);
      const ids = data.ads.map((a: { id: string }) => a.id);
      router.push(`/ads/${ids[0]}/studio?variants=${ids.slice(1).join(",")}`);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setGeneratingVariants(false);
    }
  }

  async function generateUgcScript() {
    if (!selectedUgcTemplate) return;
    setUgcGenerating(true);
    try {
      const res = await fetch("/api/ai/ugc-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedUgcTemplate,
          productName: ad.headline,
          additionalContext: ad.bodyText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      update("script", data.script);
      update("scriptFramework", data.template.name);
      success(`"${data.template.name}" script generated`);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setUgcGenerating(false);
    }
  }

  const TABS = [
    { key: "copy" as const, label: "Copy", icon: Type },
    { key: "visuals" as const, label: "Visuals", icon: ImageIcon },
    { key: "actors" as const, label: "Actors", icon: Users },
    { key: "ugc" as const, label: "UGC", icon: Mic },
    { key: "music" as const, label: "Music", icon: Music },
    { key: "settings" as const, label: "Settings", icon: Palette },
  ];

  return (
    <div className="mx-auto max-w-7xl pb-24">
      {/* Header — clean: just back, title, and unsaved indicator */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            href={`/ads/${ad.id}`}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white hover:bg-bg-secondary"
            title="Back to ad"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-lg sm:text-xl font-bold text-text-primary flex items-center gap-2 truncate">
              <SlidersHorizontal className="h-5 w-5 text-primary flex-shrink-0" /> Ad Studio
            </h1>
            <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
              <span className="rounded bg-bg-secondary px-1.5 py-0.5 font-semibold">{ad.status}</span>
              {ad.score && <span>Score: {Math.round(ad.score)}/100</span>}
              {dirty && <span className="text-warning font-semibold">● Unsaved changes</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Variant picker — shown when multiple variants exist */}
      {hasVariants && (
        <div className="mb-6 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading font-bold text-text-primary">
              {variants.length} Variants Generated
            </h2>
            <span className="text-xs text-text-secondary">Click to switch</span>
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            {variants.map((v, i) => (
              <button
                key={v.id}
                onClick={() => {
                  setAd(v);
                  setDirty(false);
                  setCustomImageUrl("");
                  setImagePrompt("");
                }}
                className={`relative overflow-hidden rounded-xl border-2 transition-all text-left ${
                  ad.id === v.id ? "border-primary shadow-md" : "border-black/10 hover:border-black/20"
                }`}
              >
                <div className="aspect-video bg-bg-secondary">
                  {v.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><Film className="h-6 w-6 text-text-secondary" /></div>
                  )}
                </div>
                <div className="p-2">
                  <div className="line-clamp-1 text-xs font-semibold text-text-primary">{v.headline ?? `Variant ${i + 1}`}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-text-secondary">Variant {i + 1}</span>
                    {v.score && (
                      <span className="rounded bg-bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-text-primary">{Math.round(v.score)}/100</span>
                    )}
                  </div>
                </div>
                {ad.id === v.id && (
                  <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        {/* Preview — left side */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className={`relative mx-auto max-w-sm ${aspectClass} overflow-hidden rounded-xl bg-bg-secondary shadow-lg`}>
                {ad.videoUrl ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video src={ad.videoUrl} controls className="h-full w-full object-cover" />
                ) : ad.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ad.thumbnailUrl} alt={ad.headline ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center"><Film className="h-12 w-12 text-text-secondary" /></div>
                )}
                {ad.headline && (
                  <div className="absolute left-0 right-0 top-3 px-3 text-center">
                    <span className="inline-block rounded-lg bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                      {ad.headline}
                    </span>
                  </div>
                )}
                {ad.callToAction && (
                  <div className="absolute bottom-3 left-0 right-0 px-3 text-center">
                    <span className="inline-block rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-lg" style={{ backgroundColor: brandColors.primary }}>
                      {ad.callToAction}
                    </span>
                  </div>
                )}
                {!isPaid && <div className="absolute bottom-2 right-2"><Watermark /></div>}
              </div>
            </div>

            {/* Video generation */}
            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {ad.videoUrl ? "Video" : "Create video"}
              </div>
              {!ad.videoUrl && (
                <>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: "6s", label: "6s", sub: "Bumper" },
                      { id: "15s", label: "15s", sub: "Short" },
                      { id: "30s", label: "30s", sub: "Standard" },
                      { id: "60s", label: "60s", sub: "Extended" },
                    ].map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setVideoDuration(d.id)}
                        className={`rounded-lg border-2 p-1.5 text-center transition-all ${
                          videoDuration === d.id ? "border-primary bg-primary/5" : "border-black/10"
                        }`}
                      >
                        <div className="text-xs font-bold text-text-primary">{d.label}</div>
                        <div className="text-[8px] text-text-secondary">{d.sub}</div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerateVideo}
                    disabled={generatingVideo}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-warning text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    {generatingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
                    {generatingVideo ? "Creating video..." : "Generate video"}
                  </button>
                </>
              )}
              {ad.videoUrl && (
                <div className="text-xs text-success font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Video ready ({ad.type})
                </div>
              )}
            </div>

            {/* Platforms */}
            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Platforms</div>
              <div className="flex flex-wrap gap-1.5">
                {ad.platform.map((p) => (
                  <span key={p} className="rounded-lg bg-bg-secondary px-2 py-1 text-xs font-semibold text-text-primary">{p}</span>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm space-y-2">
              <button
                onClick={() => handleSchedule(true)}
                disabled={scheduling}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> {scheduling ? "..." : "Publish now"}
              </button>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="flex-1 rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-xs outline-none focus:border-primary"
                />
                <button
                  onClick={() => handleSchedule(false)}
                  disabled={scheduling || !scheduleDate}
                  className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-black/10 bg-white px-3 text-xs font-semibold text-text-primary hover:bg-bg-secondary disabled:opacity-50"
                >
                  <Clock className="h-3.5 w-3.5" /> Schedule
                </button>
              </div>
              <button
                onClick={downloadAd}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-black/10 bg-white text-sm font-semibold text-text-primary hover:bg-bg-secondary"
              >
                <Download className="h-4 w-4" /> Download instead
              </button>
            </div>
          </div>
        </div>

        {/* Editor — right side */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tabs — horizontal scroll on mobile, evenly spaced on desktop */}
          <div className="flex gap-1 rounded-xl bg-bg-secondary p-1 overflow-x-auto scrollbar-hide -mx-1 sm:mx-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-shrink-0 sm:flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 min-h-[44px] text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.key ? "bg-white text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" /> {tab.label}
                </button>
              );
            })}
          </div>

          {!isPaid && (
            <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-warning flex-shrink-0" />
              <span className="text-text-secondary">Editing requires a paid plan.</span>
              <Link href="/settings/billing" className="font-semibold text-primary hover:underline ml-auto">Upgrade</Link>
            </div>
          )}

          {/* Copy tab */}
          {activeTab === "copy" && (
            <div className="rounded-2xl border border-black/5 bg-white p-4 sm:p-6 shadow-sm space-y-4">
              <AIRephraseField
                label="Headline"
                hint={`${(ad.headline ?? "").length}/80`}
                value={ad.headline ?? ""}
                onChange={(v) => update("headline", v)}
                maxLength={80}
                placeholder="Your hook"
                fieldType="headline"
                businessContext={ad.bodyText ?? undefined}
              />
              <AIRephraseField
                kind="textarea"
                label="Body text"
                hint={`${(ad.bodyText ?? "").length}/300`}
                value={ad.bodyText ?? ""}
                onChange={(v) => update("bodyText", v)}
                maxLength={300}
                placeholder="What problem does this solve?"
                fieldType="body"
                rows={4}
              />
              <AIRephraseField
                label="Call to action"
                value={ad.callToAction ?? ""}
                onChange={(v) => update("callToAction", v)}
                maxLength={50}
                placeholder="Shop now"
                fieldType="cta"
              />
              {(ad.type === "VIDEO" || ad.script) && (
                <AIRephraseField
                  kind="textarea"
                  label="Video script"
                  value={ad.script ?? ""}
                  onChange={(v) => update("script", v)}
                  placeholder="15-30 second script"
                  fieldType="script"
                  rows={5}
                />
              )}
            </div>
          )}

          {/* Visuals tab */}
          {activeTab === "visuals" && (
            <div className="rounded-2xl border border-black/5 bg-white p-4 sm:p-6 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-text-primary">Images</h3>

              {/* Current images */}
              {ad.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ad.images.map((img, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-xl bg-bg-secondary">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`Ad image ${i + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Upload custom image — file picker only */}
              <div className="rounded-xl border-2 border-dashed border-black/15 bg-bg-secondary/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  <Upload className="h-3.5 w-3.5" /> Upload your own image
                </div>

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "Choose image from your device"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        fd.append("folder", "ads/uploads");
                        const res = await fetch("/api/upload", { method: "POST", body: fd });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error ?? "Upload failed");
                        setCustomImageUrl(data.url);
                        setDirty(true);
                        success("Image uploaded — click Save to apply");
                      } catch (err) {
                        toastError((err as Error).message);
                      } finally {
                        setUploading(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>

                {customImageUrl && (
                  <div className="rounded-lg border-2 border-primary/20 bg-white p-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary mb-1">Preview (click Save to apply)</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={customImageUrl} alt="Preview" className="w-full max-h-48 object-contain rounded" />
                  </div>
                )}

                <p className="text-[10px] text-text-secondary">Max 10MB. PNG, JPG, or WebP.</p>
              </div>

              {/* AI regenerate */}
              <div className="rounded-xl border-2 border-dashed border-black/15 bg-bg-secondary/30 p-4">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  <Sparkles className="h-3.5 w-3.5" /> Regenerate with AI
                </div>
                <AIRephraseField
                  kind="textarea"
                  label="New image prompt"
                  value={imagePrompt}
                  onChange={(v) => { setImagePrompt(v); setDirty(true); }}
                  placeholder="A different angle showing..."
                  fieldType="imagePrompt"
                  rows={2}
                />
              </div>

              {/* Aspect ratio */}
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">Aspect ratio</div>
                <div className="grid grid-cols-4 gap-2">
                  {(["1:1", "9:16", "16:9", "4:5"] as const).map((ar) => (
                    <button
                      key={ar}
                      onClick={() => update("aspectRatio", ar)}
                      className={`rounded-xl border-2 p-2 text-center transition-all ${
                        ad.aspectRatio === ar ? "border-primary bg-primary/5" : "border-black/10 hover:border-black/20"
                      }`}
                    >
                      <div className="font-heading text-sm font-bold text-text-primary">{ar}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actors tab */}
          {activeTab === "actors" && (
            <div className="space-y-4">
              {/* Selected actor + script */}
              {selectedActorId && (
                <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary text-2xl font-bold text-white">
                      {AVATAR_LIBRARY.find((a) => a.id === selectedActorId)?.name?.[0] ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-heading font-bold text-text-primary">
                          {AVATAR_LIBRARY.find((a) => a.id === selectedActorId)?.name}
                        </h3>
                        <span className="text-[10px] font-bold uppercase text-text-secondary">
                          {AVATAR_LIBRARY.find((a) => a.id === selectedActorId)?.ethnicity} • {AVATAR_LIBRARY.find((a) => a.id === selectedActorId)?.situation}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedActorId("")}
                        className="text-xs text-text-secondary hover:text-danger underline"
                      >
                        Clear selection
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                      What should this actor say?
                    </label>
                    <textarea
                      value={actorScript}
                      onChange={(e) => setActorScript(e.target.value)}
                      rows={5}
                      maxLength={800}
                      placeholder="Type the exact words you want the actor to speak. e.g. 'I tried this for 30 days and the results were insane. My business doubled in revenue without me hiring anyone...'"
                      className="w-full resize-none rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-text-secondary">{actorScript.length}/800</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (ad.script) {
                            setActorScript(ad.script);
                            success("Loaded script from this ad");
                          } else {
                            toastError("This ad has no script yet — write one in the Copy tab first");
                          }
                        }}
                        className="text-primary font-semibold hover:underline"
                      >
                        Use ad script
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!actorScript.trim() || ugcGenerating}
                    onClick={async () => {
                      setUgcGenerating(true);
                      try {
                        const res = await fetch("/api/generate/avatar", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            adId: ad.id,
                            avatarId: selectedActorId,
                            script: actorScript,
                            voice: { speed: voiceSpeed, stability: voiceStability, styleExaggeration: voiceStyle },
                          }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error ?? "Generation failed");
                        success("Actor video generation started — check back in a moment");
                      } catch (err) {
                        toastError((err as Error).message);
                      } finally {
                        setUgcGenerating(false);
                      }
                    }}
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {ugcGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {ugcGenerating ? "Generating actor video..." : `Generate video with ${AVATAR_LIBRARY.find((a) => a.id === selectedActorId)?.name}`}
                  </button>
                </div>
              )}

              {/* Filters */}
              <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <h3 className="font-heading font-bold text-text-primary mb-3">Pick an actor</h3>
                <p className="text-sm text-text-secondary mb-4">{AVATAR_LIBRARY.length} AI actors and actresses to choose from</p>

                <div className="grid gap-2 sm:grid-cols-4 mb-4">
                  <input
                    type="text"
                    placeholder="Search by name, vibe, situation..."
                    value={actorFilters.search}
                    onChange={(e) => setActorFilters({ ...actorFilters, search: e.target.value })}
                    className="sm:col-span-2 rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <select
                    value={actorFilters.gender}
                    onChange={(e) => setActorFilters({ ...actorFilters, gender: e.target.value })}
                    className="rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="">All genders</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                  </select>
                  <select
                    value={actorFilters.age}
                    onChange={(e) => setActorFilters({ ...actorFilters, age: e.target.value })}
                    className="rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="">All ages</option>
                    <option value="young">Young (18-30)</option>
                    <option value="middle">Middle (30-50)</option>
                    <option value="senior">Senior (50+)</option>
                  </select>
                </div>
                <select
                  value={actorFilters.situation}
                  onChange={(e) => setActorFilters({ ...actorFilters, situation: e.target.value })}
                  className="w-full rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary mb-4"
                >
                  <option value="">All situations / settings</option>
                  {SITUATIONS.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}</option>
                  ))}
                </select>

                {/* Actor grid */}
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {filterAvatars({
                    gender: actorFilters.gender as "male" | "female" | "non-binary" | undefined || undefined,
                    age: actorFilters.age as "young" | "middle" | "senior" | undefined || undefined,
                    situation: actorFilters.situation as never || undefined,
                    search: actorFilters.search || undefined,
                  }).map((actor) => {
                    const isSelected = selectedActorId === actor.id;
                    const locked = actor.isPro && !isPaid;
                    return (
                      <button
                        key={actor.id}
                        type="button"
                        onClick={() => {
                          if (locked) {
                            toastError("This actor is Pro-only. Upgrade to use it.");
                            return;
                          }
                          setSelectedActorId(actor.id);
                        }}
                        className={`relative rounded-2xl border-2 p-3 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-black/10 hover:border-primary/40 bg-white"
                        } ${locked ? "opacity-60" : ""}`}
                      >
                        {locked && (
                          <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md bg-warning text-white">
                            <Lock className="h-3 w-3" />
                          </div>
                        )}
                        {actor.isHD && !locked && (
                          <div className="absolute top-2 right-2 rounded-md bg-success px-1.5 py-0.5 text-[8px] font-bold text-white">HD</div>
                        )}
                        <div className="aspect-square mb-2 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 text-3xl font-bold text-text-primary">
                          {actor.name[0]}
                        </div>
                        <div className="font-semibold text-sm text-text-primary">{actor.name}</div>
                        <div className="text-[10px] text-text-secondary capitalize">{actor.ethnicity} • {actor.age}</div>
                        <div className="text-[10px] text-text-secondary capitalize">{actor.situation.replace("-", " ")}</div>
                        {actor.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {actor.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="rounded bg-bg-secondary px-1.5 py-0.5 text-[9px] text-text-secondary">{tag}</span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {filterAvatars({
                  gender: actorFilters.gender as never || undefined,
                  age: actorFilters.age as never || undefined,
                  situation: actorFilters.situation as never || undefined,
                  search: actorFilters.search || undefined,
                }).length === 0 && (
                  <div className="py-8 text-center text-sm text-text-secondary">
                    No actors match your filters. Try clearing one.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* UGC tab */}
          {activeTab === "ugc" && (
            <div className="space-y-4">
              {/* UGC Script Templates */}
              <div className="rounded-2xl border border-black/5 bg-white p-4 sm:p-6 shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-text-primary">UGC Script Templates</h3>
                <p className="text-sm text-text-secondary">Pick a proven format — AI writes the script using your brand details</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { id: "street-interview", label: "Street Interview", desc: "Casual Q&A recommendation" },
                    { id: "honest-review", label: "Honest Review", desc: "Skeptical → convinced" },
                    { id: "problem-solution", label: "Problem → Solution", desc: "Pain point → your product" },
                    { id: "day-in-life", label: "Day in My Life", desc: "Product in daily routine" },
                    { id: "unboxing", label: "Unboxing", desc: "First impressions excitement" },
                    { id: "before-after", label: "Before & After", desc: "Transformation story" },
                    { id: "storytime", label: "Storytime", desc: "Personal story → recommendation" },
                    { id: "hot-take", label: "Hot Take", desc: "Bold statement → proof" },
                    { id: "comparison", label: "This vs That", desc: "Compare & win" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedUgcTemplate(selectedUgcTemplate === t.id ? "" : t.id)}
                      className={`text-left rounded-xl border-2 p-3 transition-all ${
                        selectedUgcTemplate === t.id ? "border-primary bg-primary/5" : "border-black/10 hover:border-black/20"
                      }`}
                    >
                      <div className="text-sm font-semibold text-text-primary">{t.label}</div>
                      <div className="text-[10px] text-text-secondary">{t.desc}</div>
                    </button>
                  ))}
                </div>
                {selectedUgcTemplate && (
                  <button
                    onClick={generateUgcScript}
                    disabled={ugcGenerating}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
                  >
                    {ugcGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {ugcGenerating ? "Generating script..." : "Generate UGC script"}
                  </button>
                )}
              </div>

              {/* Voice Controls */}
              <div className="rounded-2xl border border-black/5 bg-white p-4 sm:p-6 shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-text-primary flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" /> Voice Controls
                </h3>
                <p className="text-sm text-text-secondary">Fine-tune how the AI actor sounds (applies to video generation)</p>

                <div className="space-y-4">
                  <VoiceSlider label="Speed" value={voiceSpeed} min={0.5} max={2.0} step={0.1}
                    onChange={setVoiceSpeed} hint={voiceSpeed < 0.9 ? "Slow & relaxed" : voiceSpeed > 1.2 ? "Fast & energetic" : "Natural pace"} />
                  <VoiceSlider label="Stability" value={voiceStability} min={0} max={1} step={0.05}
                    onChange={setVoiceStability} hint={voiceStability < 0.3 ? "Very dynamic" : voiceStability > 0.7 ? "Consistent" : "Balanced"} />
                  <VoiceSlider label="Style / Emotion" value={voiceStyle} min={0} max={1} step={0.05}
                    onChange={setVoiceStyle} hint={voiceStyle < 0.2 ? "Neutral" : voiceStyle > 0.6 ? "Very expressive" : "Some emotion"} />
                </div>

                <div className="rounded-xl bg-accent/5 border border-accent/20 p-3 text-xs text-text-secondary">
                  <Sparkles className="inline h-3.5 w-3.5 text-accent mr-1" />
                  Voice controls will apply when AI avatar video generation is enabled (coming soon with HeyGen/ElevenLabs integration)
                </div>
              </div>

              {/* Mass Variant Generation */}
              <div className="rounded-2xl border border-black/5 bg-white p-4 sm:p-6 shadow-sm space-y-4">
                <h3 className="font-heading font-bold text-text-primary flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Mass Variant Testing
                </h3>
                <p className="text-sm text-text-secondary">
                  Generate multiple versions of this ad to A/B test which one converts best
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  {(["actors", "scripts", "both"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setVaryWhat(v)}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        varyWhat === v ? "border-primary bg-primary/5" : "border-black/10 hover:border-black/20"
                      }`}
                    >
                      <div className="text-sm font-semibold text-text-primary capitalize">{v === "both" ? "Both" : v === "actors" ? "New visuals" : "New copy"}</div>
                      <div className="text-[10px] text-text-secondary">
                        {v === "actors" ? "Same script, different people" : v === "scripts" ? "Same look, different wording" : "Everything changes"}
                      </div>
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Number of variants</span>
                    <span className="text-xs font-bold text-text-primary">{variantCount}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={10}
                    value={variantCount}
                    onChange={(e) => setVariantCount(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-text-secondary mt-1">
                    <span>2</span><span>5</span><span>10</span>
                  </div>
                </div>

                <div className="rounded-xl bg-bg-secondary p-3 text-xs text-text-secondary">
                  Cost: <strong className="text-text-primary">{variantCount} credits</strong> ({variantCount} variants × 1 credit each)
                </div>

                <button
                  onClick={generateVariants}
                  disabled={generatingVariants}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  {generatingVariants ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                  {generatingVariants ? "Generating variants..." : `Generate ${variantCount} variants`}
                </button>
              </div>
            </div>
          )}

          {/* Music tab */}
          {activeTab === "music" && (
            <div className="rounded-2xl border border-black/5 bg-white p-4 sm:p-6 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-text-primary">Background Music</h3>
              <p className="text-sm text-text-secondary">Pick a genre for the video version of your ad</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {MUSIC_OPTIONS.map((g) => (
                  <button
                    key={g}
                    onClick={() => update("musicGenre", ad.musicGenre === g ? null : g)}
                    className={`rounded-xl border-2 px-3 py-2.5 text-xs font-semibold capitalize transition-all ${
                      ad.musicGenre === g ? "border-primary bg-primary/5 text-primary" : "border-black/10 hover:border-black/20 text-text-primary"
                    }`}
                  >
                    {g.replace(/-/g, " ")}
                  </button>
                ))}
              </div>
              {ad.musicGenre && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm">
                  <CheckCircle2 className="inline h-4 w-4 text-primary mr-1.5" />
                  Selected: <strong className="text-primary capitalize">{ad.musicGenre.replace(/-/g, " ")}</strong>
                </div>
              )}
            </div>
          )}

          {/* Settings tab */}
          {activeTab === "settings" && (
            <div className="rounded-2xl border border-black/5 bg-white p-4 sm:p-6 shadow-sm space-y-4">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  <Languages className="inline h-3.5 w-3.5 mr-1" /> Language
                </div>
                <select
                  value={ad.language}
                  onChange={(e) => update("language", e.target.value)}
                  className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
                >
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  <Palette className="inline h-3.5 w-3.5 mr-1" /> Brand Colors (from your Brand Kit)
                </div>
                <div className="flex gap-2 rounded-xl overflow-hidden h-10">
                  <div className="flex-1" style={{ backgroundColor: brandColors.primary }} />
                  <div className="flex-1" style={{ backgroundColor: brandColors.secondary }} />
                  <div className="flex-1" style={{ backgroundColor: brandColors.accent }} />
                </div>
                <Link href="/settings/brand" className="mt-2 block text-xs text-primary font-semibold hover:underline">
                  Edit in Brand Kit →
                </Link>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">Brand voice</div>
                <div className="rounded-xl bg-bg-secondary px-3 py-2 text-sm text-text-primary capitalize">{brandVoice}</div>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">Ad type</div>
                <div className="rounded-xl bg-bg-secondary px-3 py-2 text-sm text-text-primary">{ad.type}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save as Template modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
              <h2 className="font-heading text-lg font-bold text-text-primary">Save as Template</h2>
              <button onClick={() => setShowTemplateModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-secondary hover:bg-black/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Template name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Summer Sale Fashion Ad"
                  className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Description</label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  rows={2}
                  placeholder="Great for fashion brands running seasonal promotions..."
                  className="w-full resize-none rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Category</label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
                >
                  {["restaurant", "fashion", "tech", "real-estate", "fitness", "beauty", "education", "e-commerce", "travel", "finance", "other"].map((c) => (
                    <option key={c} value={c} className="capitalize">{c.replace("-", " ")}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between rounded-xl border-2 border-black/10 p-3">
                <div>
                  <div className="font-heading text-sm font-semibold text-text-primary">Publish to marketplace</div>
                  <div className="text-xs text-text-secondary">Other users can find and use this template</div>
                </div>
                <button
                  type="button"
                  onClick={() => setTemplateForm({ ...templateForm, isPublic: !templateForm.isPublic })}
                  className={`h-6 w-11 rounded-full transition-colors ${templateForm.isPublic ? "bg-primary" : "bg-bg-secondary"}`}
                >
                  <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${templateForm.isPublic ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {templateForm.isPublic && (
                <div className="flex items-center justify-between rounded-xl border-2 border-black/10 p-3">
                  <div>
                    <div className="font-heading text-sm font-semibold text-text-primary">Sell this template</div>
                    <div className="text-xs text-text-secondary">Earn 70% of each sale (30% platform fee)</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTemplateForm({ ...templateForm, isPremium: !templateForm.isPremium })}
                    className={`h-6 w-11 rounded-full transition-colors ${templateForm.isPremium ? "bg-primary" : "bg-bg-secondary"}`}
                  >
                    <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${templateForm.isPremium ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
              )}

              {templateForm.isPublic && templateForm.isPremium && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">Price (credits)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={templateForm.price}
                    onChange={(e) => setTemplateForm({ ...templateForm, price: Number(e.target.value) })}
                    className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <p className="mt-1 text-xs text-text-secondary">
                    You earn {Math.round(templateForm.price * 0.7)} credits per sale
                  </p>
                </div>
              )}

              <button
                onClick={saveAsTemplate}
                disabled={savingTemplate || !templateForm.name.trim()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                <BookTemplate className="h-4 w-4" />
                {savingTemplate ? "Saving..." : templateForm.isPublic ? "Publish to marketplace" : "Save template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky bottom action bar — primary actions always reachable */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 dark:border-white/10 bg-white/95 dark:bg-bg-dark/95 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:left-64">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
          {/* Secondary actions (left) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={downloadAd}
              className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-black/10 dark:border-white/15 bg-white dark:bg-white/5 px-3 text-xs sm:text-sm font-semibold text-text-primary dark:text-white hover:bg-bg-secondary"
              title="Download ad"
            >
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="hidden sm:flex h-10 items-center gap-1.5 rounded-xl border-2 border-accent/20 bg-accent/5 px-3 text-xs sm:text-sm font-semibold text-accent hover:bg-accent/10 transition-colors"
              title="Save as template"
            >
              <BookTemplate className="h-4 w-4" /> Template
            </button>
          </div>

          {/* Primary actions (right) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isPaid && (
              <button
                onClick={save}
                disabled={saving || !dirty}
                className="flex h-11 items-center gap-1.5 rounded-xl border-2 border-primary/30 bg-primary/5 px-3 sm:px-4 text-xs sm:text-sm font-bold text-primary hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
              </button>
            )}
            <button
              onClick={() => handleSchedule(true)}
              disabled={scheduling || dirty}
              title={dirty ? "Save your changes first" : "Publish this ad now"}
              className="flex h-11 items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-accent px-4 sm:px-5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-primary/30 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="h-4 w-4" />
              {scheduling ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VoiceSlider({ label, value, min, max, step, onChange, hint }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; hint: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-text-primary">{label}</span>
        <span className="text-[10px] font-semibold text-primary">{value.toFixed(1)} — {hint}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}
