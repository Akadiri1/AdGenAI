"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, Download, Send, Clock, Save, SlidersHorizontal,
  Image as ImageIcon, Music, Languages, Palette, Type,
  Sparkles, Upload, Lock, Film, CheckCircle2, BookTemplate, X,
  Users, Copy, Mic, Loader2, Plus, Play, ShieldAlert,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { AIRephraseField } from "@/components/ui/AIRephraseField";
import { Watermark } from "@/components/Logo";
import { AVATAR_LIBRARY, SITUATIONS, filterAvatars, type Avatar } from "@/lib/avatars";
import { groupWordsIntoChunks, type WordTimestamp, type CaptionChunk, type CaptionStyle } from "@/lib/captions";
import { KaraokeCaptions } from "@/components/studio/KaraokeCaptions";

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
  visualInstructions: string | null;
  aspectRatio: string;
  language: string;
  score: number | null;
  platform: string[];
  captionData?: WordTimestamp[];
};

const LANGUAGES = [
  { code: "en", label: "English" }, { code: "es", label: "Spanish" }, { code: "fr", label: "French" },
  { code: "de", label: "German" }, { code: "pt", label: "Portuguese" }, { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" }, { code: "ja", label: "Japanese" }, { code: "sw", label: "Swahili" },
];

const MUSIC_OPTIONS = [
  "none", "pop", "cinematic", "corporate", "hip-hop", "lo-fi", "electronic",
  "afrobeats", "amapiano", "jazz", "classical", "motivational", "chill",
  "trending-tiktok", "trending-reels", "rock", "country", "funk", "synthwave",
  "ambient", "acoustic", "uplifting", "dark-trap", "uk-drill", "rnb", "indie-folk",
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
  const [allVariants, setAllVariants] = useState(variants);
  const hasVariants = allVariants.length > 1;
  const [activeTab, setActiveTab] = useState<"copy" | "visuals" | "actors">("copy");
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
  const [sceneCount, setSceneCount] = useState(3);
  const [varyWhat, setVaryWhat] = useState<"actors" | "scripts" | "both">("both");
  const [ugcGenerating, setUgcGenerating] = useState(false);
  const [selectedUgcTemplate, setSelectedUgcTemplate] = useState("");
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedActorId, setSelectedActorId] = useState<string>("");
  const [selectedAccent, setSelectedAccent] = useState<"us" | "uk" | "ng">("us");
  const [showSafeZone, setShowSafeZone] = useState(false);
  
  // Captions state
  const [captionsOn, setCaptionsOn] = useState(true);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>("viral");
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);

  const captionChunks = ad.captionData ? groupWordsIntoChunks(ad.captionData) : [];

  function playSample(actor: Avatar, accent: "us" | "uk" | "ng") {
    const url = actor.audioSamples?.[accent];
    if (!url) return;
    
    if (playingSampleId === `${actor.id}-${accent}`) {
      audioRef.current?.pause();
      setPlayingSampleId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();
      setPlayingSampleId(`${actor.id}-${accent}`);
    }
  }

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => setPlayingSampleId(null);
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [ad.videoUrl]);

  function update<K extends keyof Ad>(key: K, val: Ad[K]) {
    setAd({ ...ad, [key]: val });
    setDirty(true);
  }

  const filteredPlatforms = ad.platform.filter(p => p !== "PINTEREST");

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
          visualInstructions: ad.visualInstructions,
          scriptFramework: ad.scriptFramework,
          musicGenre: ad.musicGenre,
          aspectRatio: ad.aspectRatio,
          platform: filteredPlatforms,
          ...(customImageUrl && { customImageUrl }),
          ...(imagePrompt && { regenerateImage: true, newImagePrompt: imagePrompt, numScenes: sceneCount }),
          ...(!imagePrompt && dirty && activeTab === "visuals" && { regenerateImage: true, numScenes: sceneCount }),
        }),
      });

      let data: any = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) throw new Error(data.error ?? `Save failed (${res.status})`);
      
      const updatedAd = { 
        ...ad, 
        platform: filteredPlatforms,
        ...(data.ad?.thumbnailUrl && { thumbnailUrl: data.ad.thumbnailUrl, videoUrl: null }),
        ...(data.ad?.images && { images: data.ad.images })
      };
      
      setAd(updatedAd);
      setAllVariants(prev => prev.map(v => v.id === ad.id ? updatedAd : v));
      
      setDirty(false);
      setCustomImageUrl("");
      setImagePrompt("");
      success(data.message ?? "Changes saved");
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

  async function handleGenerateVideo() {
    setGeneratingVideo(true);
    try {
      const res = await fetch(`/api/ads/${ad.id}/video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          duration: videoDuration,
          captions: captionsOn ? captionStyle : null,
          accent: selectedAccent,
          avatarId: selectedActorId
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Video generation failed");
      setAd({ ...ad, videoUrl: data.videoUrl, type: "VIDEO", captionData: data.captionData });
      success(`${videoDuration} video created`);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setGeneratingVideo(false);
    }
  }

  function downloadAd(target?: Ad) {
    const aToDown = target ?? ad;
    const url = aToDown.videoUrl ?? aToDown.thumbnailUrl;
    if (!url) { toastError("No media to download"); return; }
    const a = document.createElement("a");
    a.href = url;
    a.download = `famousli-${aToDown.id}.${aToDown.videoUrl ? "mp4" : "png"}`;
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

  const TABS = [
    { key: "copy" as const, label: "Copy", icon: Type },
    { key: "visuals" as const, label: "Scenes", icon: Film },
    { key: "actors" as const, label: "Actors", icon: Users },
  ];

  const videoCost = 2;

  return (
    <div className="mx-auto max-w-7xl pb-28 overflow-x-hidden">
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

      {hasVariants && (
        <div className="mb-6 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading font-bold text-text-primary">
              {allVariants.length} Variants Generated
            </h2>
            <span className="text-xs text-text-secondary">Click to switch</span>
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            {allVariants.map((v, i) => (
              <div
                key={v.id}
                className={`group relative overflow-hidden rounded-xl border-2 transition-all text-left ${
                  ad.id === v.id ? "border-primary shadow-md" : "border-black/10 hover:border-black/20"
                }`}
              >
                <button
                  onClick={() => {
                    if (dirty && !confirm("You have unsaved changes on this variant. Switch anyway?")) {
                      return;
                    }
                    setAd(v);
                    setDirty(false);
                    setCustomImageUrl("");
                    setImagePrompt("");
                  }}
                  className="w-full h-full text-left"
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
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); downloadAd(v); }}
                  className="absolute left-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-primary shadow-lg"
                  title="Download this variant"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                {ad.id === v.id && (
                  <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setPreviewCollapsed(!previewCollapsed)}
        className="lg:hidden mb-3 flex w-full items-center justify-between rounded-xl border-2 border-black/10 bg-white dark:bg-white/5 px-4 py-3 text-sm font-semibold text-text-primary hover:bg-bg-secondary"
      >
        <span className="flex items-center gap-2">
          <Film className="h-4 w-4 text-primary" />
          {previewCollapsed ? "Show preview" : "Hide preview"}
        </span>
        <span className="text-xs text-text-secondary">{previewCollapsed ? "▼" : "▲"}</span>
      </button>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
        <div className={`lg:col-span-2 ${previewCollapsed ? "hidden lg:block" : ""}`}>
          <div className="lg:sticky lg:top-20 space-y-4">
            <div className="rounded-2xl border border-black/5 bg-white p-3 sm:p-4 shadow-sm">
              <div className={`relative mx-auto w-full max-w-[200px] sm:max-w-xs lg:max-w-sm ${aspectClass} overflow-hidden rounded-xl bg-bg-secondary shadow-lg`}>
                {ad.videoUrl ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video ref={videoRef} src={ad.videoUrl} controls className="h-full w-full object-cover" />
                ) : ad.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ad.thumbnailUrl} alt={ad.headline ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center"><Film className="h-12 w-12 text-text-secondary" /></div>
                )}

                {/* Safe Zone Overlay */}
                {showSafeZone && ad.aspectRatio === "9:16" && (
                  <div className="absolute inset-0 pointer-events-none z-10 border-x-[40px] border-b-[80px] border-t-[20px] border-transparent">
                    <div className="absolute bottom-4 left-4 right-20 h-10 border-2 border-dashed border-warning/40 rounded flex items-center justify-center text-[8px] font-bold text-warning/60 bg-warning/5">DESCRIPTIONS</div>
                    <div className="absolute top-4 right-2 bottom-20 w-12 border-2 border-dashed border-warning/40 rounded flex items-center justify-center text-[8px] font-bold text-warning/60 bg-warning/5 [writing-mode:vertical-lr]">BUTTONS</div>
                  </div>
                )}

                {/* Viral Karaoke Captions */}
                {captionsOn && (ad.videoUrl || ad.thumbnailUrl) && captionChunks.length > 0 && (
                  <KaraokeCaptions currentTime={currentTime} chunks={captionChunks} style={captionStyle} />
                )}

                {generatingVideo && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white p-6 text-center">
                    <div className="relative mb-4">
                      <div className="h-16 w-16 rounded-full border-4 border-white/20 border-t-primary animate-spin" />
                      <Film className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-primary" />
                    </div>
                    <div className="font-heading font-bold text-sm">Veo is dreaming up your ad...</div>
                    <p className="mt-1 text-[10px] text-white/70">Assembling scenes, high-end FX, and voiceover.</p>
                  </div>
                )}

                {/* Real-time Headline/CTA preview removed */}
                {!isPaid && <div className="absolute bottom-2 right-2"><Watermark /></div>}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => setShowSafeZone(!showSafeZone)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    showSafeZone ? "bg-warning/10 text-warning" : "bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80"
                  }`}
                >
                  <ShieldAlert className="h-3 w-3" />
                  {showSafeZone ? "Safe Zones: ON" : "Show Safe Zones"}
                </button>
                <div className="text-[10px] font-semibold text-text-secondary">Preview (Estimated)</div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                {ad.videoUrl ? "Video" : "Create video"}
              </div>

              <div>
                <div className="mb-2 text-[10px] font-bold uppercase text-text-secondary">Aspect ratio</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["1:1", "9:16", "16:9", "4:5"] as const).map((ar) => (
                    <button
                      key={ar}
                      onClick={() => update("aspectRatio", ar)}
                      className={`rounded-lg border-2 p-1.5 text-center transition-all ${
                        ad.aspectRatio === ar ? "border-primary bg-primary/5 shadow-sm" : "border-black/10 hover:border-black/20"
                      }`}
                    >
                      <div className="text-[11px] font-bold text-text-primary">{ar}</div>
                    </button>
                  ))}
                </div>
              </div>

              {!ad.videoUrl && !generatingVideo && (
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
                        className={`rounded-lg border-2 p-1.5 text-center transition-all min-h-[52px] ${
                          videoDuration === d.id ? "border-primary bg-primary/10 shadow-sm" : "border-black/10 dark:border-white/15 bg-white dark:bg-white/5"
                        }`}
                      >
                        <div className="text-[11px] font-bold text-text-primary dark:text-white">{d.label}</div>
                        <div className="text-[9px] text-text-secondary dark:text-white/60">{d.sub}</div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerateVideo}
                    disabled={generatingVideo}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-warning text-sm font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    <Film className="h-4 w-4" />
                    Generate ({videoCost} credits)
                  </button>
                </>
              )}

              {generatingVideo && (
                <div className="rounded-xl bg-bg-secondary p-4 text-center space-y-3 animate-pulse border-2 border-primary/20">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-text-primary">Veo is dreaming...</div>
                    <div className="text-[10px] text-text-secondary">Adding music & professional voiceover</div>
                  </div>
                </div>
              )}

              {ad.videoUrl && (
                <div className="text-xs text-success font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Video ready ({ad.type})
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Target Platforms</div>
              <div className="flex flex-wrap gap-1.5">
                {filteredPlatforms.map((p) => (
                  <span key={p} className="rounded-lg bg-bg-secondary px-2 py-1 text-[10px] font-bold text-text-primary uppercase tracking-tight">{p.replace("_", " ")}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
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

          {activeTab === "copy" && (
            <div className="rounded-2xl border border-black/5 bg-white p-4 sm:p-6 shadow-sm space-y-6">
              <div className="space-y-4">
                <AIRephraseField
                  kind="textarea"
                  label="Script for Voiceover"
                  hint={`${(ad.script ?? "").length}/800`}
                  value={ad.script ?? ""}
                  onChange={(v) => update("script", v)}
                  maxLength={800}
                  placeholder="What should the AI voice say?"
                  fieldType="body"
                  rows={6}
                />
                
                {/* Viral Captions Toggle & Styles */}
                <div className="pt-4 border-t border-black/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-primary">Viral Karaoke Captions</div>
                        <div className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">TikTok & Reels Style</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setCaptionsOn(!captionsOn)}
                      className={`h-6 w-11 rounded-full transition-colors ${captionsOn ? "bg-primary" : "bg-bg-secondary"}`}
                    >
                      <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${captionsOn ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>

                  {captionsOn && (
                    <div className="grid grid-cols-3 gap-2">
                      {(["classic", "viral", "cyber"] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() => setCaptionStyle(style)}
                          className={`rounded-xl border-2 p-2.5 text-center transition-all ${
                            captionStyle === style ? "border-primary bg-primary/5 shadow-sm scale-[1.02]" : "border-black/10 bg-white hover:border-black/20"
                          }`}
                        >
                          <div className={`text-[10px] font-black uppercase italic ${
                            style === 'viral' ? 'text-yellow-500' : style === 'cyber' ? 'text-green-500' : 'text-text-primary'
                          }`}>
                            {style}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "visuals" && (
            <div className="rounded-2xl border border-black/5 bg-white p-4 sm:p-6 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-text-primary">Video Scenes</h3>
              
              {ad.images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {ad.images.map((img, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-xl bg-bg-secondary group relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="h-full w-full object-cover" />
                      <div className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-bold text-white">#{i + 1}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-xl border-2 border-dashed border-black/15 bg-bg-secondary/30 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-text-primary">How many scenes?</div>
                    <div className="text-[10px] text-text-secondary">
                      {isPaid ? "Up to 10 allowed (Pro)" : "Starter plan limited to 4 scenes"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
                      const disabled = !isPaid && n > 4;
                      return (
                        <button
                          key={n}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSceneCount(n)}
                          className={`h-7 w-7 rounded-lg border-2 text-[10px] font-bold transition-all ${
                            sceneCount === n ? "border-primary bg-primary text-white" : "border-black/10 bg-white text-text-secondary hover:border-black/20"
                          } ${disabled ? "opacity-30 grayscale cursor-not-allowed" : ""}`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <button
                  onClick={save}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white shadow-md"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate {sceneCount} Scenes ({sceneCount} credits)
                </button>
              </div>
            </div>
          )}

          {activeTab === "actors" && (
            <div className="space-y-4">
              {selectedActorId && (
                <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5">
                  <div className="flex items-start gap-4">
                    {(() => {
                      const actor = AVATAR_LIBRARY.find(a => a.id === selectedActorId);
                      return (
                        <>
                          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-4 border-white shadow-xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={actor?.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-heading font-bold text-text-primary text-lg">{actor?.name}</h3>
                            <p className="text-xs text-text-secondary uppercase font-bold tracking-wider">{actor?.ethnicity} • {actor?.situation}</p>
                            
                            <div className="mt-4 space-y-3">
                              <div className="text-[10px] font-bold text-text-secondary uppercase">Choose Accent</div>
                              <div className="flex gap-2">
                                {["us", "uk", "ng"].map((acc) => {
                                  const hasSample = actor?.audioSamples?.[acc as keyof typeof actor.audioSamples];
                                  return (
                                    <button
                                      key={acc}
                                      onClick={() => setSelectedAccent(acc as any)}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                                        selectedAccent === acc ? "border-primary bg-primary text-white" : "border-black/10 bg-white hover:border-black/20"
                                      } ${!hasSample ? "opacity-30 grayscale cursor-not-allowed" : ""}`}
                                      disabled={!hasSample}
                                    >
                                      <span className="text-xs font-bold uppercase">{acc}</span>
                                      {hasSample && (
                                        <div 
                                          onClick={(e) => { e.stopPropagation(); playSample(actor!, acc as any); }}
                                          className={`p-1 rounded-full ${selectedAccent === acc ? "bg-white/20" : "bg-primary/10 text-primary"}`}
                                        >
                                          {playingSampleId === `${actor?.id}-${acc}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <h3 className="font-heading font-bold text-text-primary mb-4">Select AI Actor & Voice</h3>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {AVATAR_LIBRARY.map((actor) => {
                    const isSelected = selectedActorId === actor.id;
                    const locked = actor.isPro && !isPaid;
                    return (
                      <button
                        key={actor.id}
                        type="button"
                        onClick={() => !locked && setSelectedActorId(actor.id)}
                        className={`relative rounded-2xl border-2 p-3 text-left transition-all ${
                          isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-black/10 bg-white"
                        } ${locked ? "opacity-50" : ""}`}
                      >
                        <div className="aspect-square mb-2 overflow-hidden rounded-xl bg-bg-secondary">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={actor.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="font-bold text-xs text-text-primary truncate">{actor.name}</div>
                        {actor.audioSamples && (
                          <div className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
                            <Mic className="h-2.5 w-2.5" />
                          </div>
                        )}
                        {locked && <Lock className="absolute top-2 right-2 h-3 w-3 text-warning" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:left-64">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-3">
            <button
              onClick={() => downloadAd()}
              className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-black/10 bg-white px-3 text-xs font-semibold"
            >
              <Download className="h-4 w-4" /> Download
            </button>
            {dirty && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-warning animate-pulse">
                <span className="h-2 w-2 rounded-full bg-warning" /> Unsaved Changes
              </div>
            )}
          </div>

          <div className="flex w-full sm:w-auto items-center gap-2">
            {dirty ? (
              <button
                onClick={save}
                disabled={saving}
                className="flex h-12 w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm font-bold text-white shadow-lg"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save & Apply Changes
              </button>
            ) : (
              <button
                onClick={() => handleSchedule(true)}
                disabled={scheduling}
                className="flex h-12 w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-8 text-sm font-bold text-white shadow-lg"
              >
                {scheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Publish Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
