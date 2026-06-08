"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Search, Play, Mic, Volume2, Film,
  Loader2, Crown, SlidersHorizontal, User2, Upload, Pause, Wand2, Sparkles, Check, X, Settings2, FileText, Lightbulb,
  CheckCircle2, AlertTriangle, User, Smile, Zap, Briefcase
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useCredits } from "@/components/CreditsProvider";
import { AIRephraseField } from "@/components/ui/AIRephraseField";
import { MultiFileUpload } from "@/components/ui/MultiFileUpload";
import { TemplatesModal } from "@/components/studio/TemplatesModal";
import { AVATAR_LIBRARY, DEFAULT_VOICE_SETTINGS, type Avatar, type VoiceSettings } from "@/lib/avatars";

type Duration = 5 | 10 | 15 | 30 | 60;

function estimateCredits(targetSeconds: Duration): {
  sceneCount: number;
  render: number;
  finalize: number;
  total: number;
  renderMinutes: string;
} {
  const sceneCount = targetSeconds <= 10 ? 1 : Math.max(2, Math.min(6, Math.round(targetSeconds / 6)));
  const render = targetSeconds + sceneCount * 3;
  const finalize = 5 + sceneCount * 2;
  const minPerScene = 1;
  const maxPerScene = 1.5;
  const finalizeMin = 1.5;
  const finalizeMax = 2.5;
  const lo = Math.ceil(sceneCount * minPerScene + finalizeMin);
  const hi = Math.ceil(sceneCount * maxPerScene + finalizeMax);
  const renderMinutes = lo === hi ? `~${lo}` : `~${lo}–${hi}`;
  return { sceneCount, render, finalize, total: render + finalize, renderMinutes };
}

const DURATIONS: Duration[] = [5, 10, 15, 30, 60];

const VOICE_PROFILES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah",   gender: "female" as const, description: "Young woman · warm & friendly",     icon: Smile },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily",    gender: "female" as const, description: "Young woman · upbeat & energetic",  icon: Zap },
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel",  gender: "female" as const, description: "Mature woman · calm & trusted",     icon: Briefcase },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian",   gender: "male"   as const, description: "Young man · deep & confident",      icon: User2 },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam",    gender: "male"   as const, description: "Young man · casual & friendly",    icon: Smile },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill",    gender: "male"   as const, description: "Mature man · authoritative",        icon: Briefcase },
];

export function UGCCreatorClient({ isFree = false }: { isFree?: boolean } = {}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { refreshCredits } = useCredits();

  // Single page state
  const [isActorModalOpen, setIsActorModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(AVATAR_LIBRARY[0]);
  const [script, setScript] = useState("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [visualInstructions, setVisualInstructions] = useState("");
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("EXAVITQu4vr4xnSDxMaL");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "1:1" | "16:9">("9:16");
  const [targetSeconds, setTargetSeconds] = useState<Duration>(15);
  const [generating, setGenerating] = useState(false);
  const [showAdvancedVoice, setShowAdvancedVoice] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const [backgroundMusic, setBackgroundMusic] = useState<string>("");
  const [autoCaptions, setAutoCaptions] = useState(true);

  const cost = estimateCredits(targetSeconds);

  const [customActorImage, setCustomActorImage] = useState("");
  const [customActorGender, setCustomActorGender] = useState<"female" | "male">("female");
  const [uploadingActor, setUploadingActor] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [previewingVoice, setPreviewingVoice] = useState(false);

  const [productName, setProductName] = useState("");
  const [productOffer, setProductOffer] = useState("");
  const [productDescription, setProductDescription] = useState("");

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => setPlayingSampleId(null);
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  async function previewVoice(avatar: Avatar & { voiceId?: string }, overrideVoiceId?: string) {
    if (previewingVoice) {
      audioRef.current?.pause();
      setPlayingSampleId(null);
      setPreviewingVoice(false);
      return;
    }
    setPreviewingVoice(true);
    setPlayingSampleId(overrideVoiceId ?? avatar.id);
    try {
      const gender = avatar.id.startsWith("custom-")
        ? customActorGender
        : (avatar.gender === "non-binary" ? "female" : avatar.gender);
      const res = await fetch("/api/ai/voice-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: overrideVoiceId ?? selectedVoiceId ?? avatar.voiceId ?? undefined,
          gender,
          speed:             voiceSettings.speed,
          stability:         voiceSettings.stability,
          similarity:        voiceSettings.similarity,
          styleExaggeration: voiceSettings.styleExaggeration,
          voicePrompt:       voiceSettings.voicePrompt,
          voiceUrl:          voiceSettings.voiceUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Preview failed");
      if (audioRef.current) {
        audioRef.current.src = data.url;
        audioRef.current.play().catch(console.error);
      }
    } catch {
      setPlayingSampleId(null);
    } finally {
      setPreviewingVoice(false);
    }
  }

  async function generate() {
    if (!selectedAvatar || !script.trim()) {
      toastError("Please select an actor and write a script.");
      return;
    }
    setGenerating(true);
    try {
      const isCustomActor = selectedAvatar.id.startsWith("custom-");
      const res = await fetch("/api/generate/ecommerce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isCustomActor
            ? { customActorImageUrl: customActorImage, customActorGender }
            : { avatarLibraryId: selectedAvatar.id }),
          customScript: script,
          productName: productName || undefined,
          productOffer: productOffer || undefined,
          productDescription: productDescription || undefined,
          productImageUrls: productImages,
          visualInstructions: visualInstructions || undefined,
          backgroundMusic,
          autoCaptions,
          voiceSettings: { 
            ...voiceSettings, 
            voiceId: selectedVoiceId,
            voiceUrl: voiceSettings.voiceUrl || undefined,
            voicePrompt: voiceSettings.voicePrompt || undefined,
          },
          aspectRatio,
          targetSeconds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      refreshCredits();
      if (data.promptOnly) {
        success("Prompts ready — copy them to any AI video tool");
        router.push(`/ads/${data.adId}/prompts`);
      } else {
        success("Draft created — review and confirm in Studio");
        router.push(`/ads/${data.adId}/studio`);
      }
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary">Studio</h1>
          <p className="text-text-secondary mt-1">Create your video ad seamlessly in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={generate}
            disabled={generating || !script.trim() || !selectedAvatar}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-warning px-8 text-sm font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {isFree ? "Generating prompts..." : "Building draft..."}</>
            ) : (
              <><Play className="h-4 w-4 fill-white" /> {isFree ? "Generate Prompts" : `Generate Video (${cost.total} cr)`}</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Editor */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Script Section */}
          <div className="rounded-2xl border border-black/5 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold text-text-primary flex items-center gap-2">
                <Film className="h-5 w-5 text-primary" /> Script
              </h2>
              <button
                onClick={() => setShowTemplates(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <FileText className="h-4 w-4" /> Templates
              </button>
            </div>
            
            {script.trim() && (() => {
              const wordCount = script.trim().split(/\s+/).length;
              const estimatedSecs = Math.round(wordCount / 2.5);
              const maxWords = Math.round(targetSeconds * 2.5);
              const pct = Math.min((wordCount / maxWords) * 100, 100);
              const tooLong = wordCount > maxWords * 1.15;
              const slightlyOver = wordCount > maxWords && !tooLong;
              const perfect = wordCount >= maxWords * 0.7 && wordCount <= maxWords;
              return (
                <div className={`mb-4 rounded-xl p-3 text-xs flex items-center justify-between gap-3 ${
                  tooLong ? "bg-danger/10 border border-danger/20" :
                  slightlyOver ? "bg-warning/10 border border-warning/20" :
                  perfect ? "bg-success/10 border border-success/20" :
                  "bg-bg-secondary border border-black/5"
                }`}>
                  <div>
                    <span className={`font-bold flex items-center gap-1.5 ${tooLong ? "text-danger" : slightlyOver ? "text-warning" : perfect ? "text-success" : "text-text-secondary"}`}>
                      {tooLong ? (
                        <><AlertTriangle className="h-3.5 w-3.5" /> Script too long</>
                      ) : slightlyOver ? (
                        <><AlertTriangle className="h-3.5 w-3.5" /> Slightly over</>
                      ) : perfect ? (
                        <><CheckCircle2 className="h-3.5 w-3.5" /> Perfect length</>
                      ) : (
                        <><FileText className="h-3.5 w-3.5" /> {wordCount} words</>
                      )}
                    </span>
                    <span className="text-text-secondary ml-2">
                      ~{estimatedSecs}s spoken · target {targetSeconds}s · max ~{maxWords} words
                    </span>
                  </div>
                  <div className="flex-shrink-0 w-16 hidden sm:block">
                    <div className="h-1.5 w-full rounded-full bg-black/10 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${tooLong ? "bg-danger" : slightlyOver ? "bg-warning" : perfect ? "bg-success" : "bg-primary"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })()}

            <AIRephraseField
              kind="textarea"
              label="What should the actor say?"
              hint={`${script.trim().split(/\s+/).filter(Boolean).length} words`}
              value={script}
              onChange={setScript}
              placeholder="Write your script here. Keep it natural and casual."
              fieldType="script"
              targetWords={Math.round(targetSeconds * 2.5)}
              rows={8}
            />
          </div>

          {/* Visual Instructions & Product */}
          <div className="rounded-2xl border border-black/5 bg-white shadow-sm p-6 space-y-5">
            <h2 className="font-heading text-xl font-bold flex items-center gap-2 text-text-primary">
              <Sparkles className="h-6 w-6 text-primary" /> Visuals & Product <span className="text-base font-normal text-text-secondary">(Optional)</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-6">
              <div>
                <AIRephraseField
                  kind="textarea"
                  label="Visual Instructions"
                  hint={`${visualInstructions.length} chars`}
                  value={visualInstructions}
                  onChange={setVisualInstructions}
                  placeholder="E.g. Bright modern Lagos apartment, warm afternoon light. Actor does a slow confident spin showing the dress."
                  fieldType="imagePrompt"
                  rows={4}
                  maxLength={500}
                />
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "Lagos apartment", "White studio", "Talks to camera", "Holds product up"
                  ].map((t) => (
                    <button key={t} onClick={() => setVisualInstructions(prev => prev ? `${prev} ${t}.` : `${t}.`)} className="rounded-full border border-black/10 bg-bg-secondary px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-black/5 transition-colors">
                      + {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-10 flex flex-col items-start">
                <div className="flex flex-wrap gap-2 mb-4">
                  {productImages.map((url, i) => (
                    <div key={i} className="relative w-20 h-24 rounded-[20px] overflow-hidden border border-black/10 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="upload" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setProductImages(productImages.filter((_, index) => index !== i))}
                        className="absolute top-1 right-1 bg-black/50 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {productImages.length < 5 && (
                    <div className="w-20 h-24 rounded-[20px] border-2 border-dashed border-black/10 flex flex-col items-center justify-center text-text-secondary hover:bg-bg-secondary hover:border-black/20 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const remaining = 5 - productImages.length;
                            const files = Array.from(e.target.files).slice(0, remaining);
                            
                            const { useToast } = await import("@/components/ui/Toast");
                            const { compressImage } = await import("@/lib/compressImage");

                            for (const f of files) {
                              try {
                                const compressed = await compressImage(f, 2.5);
                                const fd = new FormData();
                                fd.append("file", compressed);
                                fd.append("folder", "products");
                                
                                const res = await fetch("/api/upload", { method: "POST", body: fd });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error ?? "Upload failed");
                                
                                setProductImages(prev => [...prev, data.url]);
                              } catch (err) {
                                toastError((err as Error).message);
                              }
                            }

                            if (productImages.length + files.length > 5) {
                              toastError("You can only upload up to 5 images.");
                            }
                          }
                        }}
                      />
                      <Upload className="h-6 w-6 mb-1 text-text-secondary" />
                      <span className="text-xs font-bold text-text-primary">Add</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed max-w-[200px]">
                   PNG, JPG, WebP — any size, auto-compressed before upload. {productImages.length}/5 uploaded.
                </p>
              </div>
            </div>
          </div>

          {/* Settings Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Format & Duration */}
            <div className="rounded-2xl border border-black/5 bg-white shadow-sm p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
                <Settings2 className="h-5 w-5 text-primary" /> Format
              </h2>
              
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2 block">Aspect ratio</label>
                <div className="flex gap-2">
                  {(["9:16", "1:1", "16:9"] as const).map((ar) => (
                    <button key={ar} onClick={() => setAspectRatio(ar)}
                      className={`flex-1 rounded-xl border-2 py-2 text-xs font-bold transition-all ${aspectRatio === ar ? "border-primary bg-primary/5 text-primary" : "border-black/10 text-text-secondary hover:border-black/20"}`}>
                      {ar}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2 block">Duration</label>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map((d) => (
                    <button key={d} onClick={() => setTargetSeconds(d)}
                      className={`flex-1 min-w-[50px] rounded-xl border-2 py-2 text-xs font-bold transition-all ${targetSeconds === d ? "border-primary bg-primary/5 text-primary" : "border-black/10 text-text-secondary hover:border-black/20"}`}>
                      {d}s
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2 block">Background Music</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "None", url: "" },
                    { label: "Lo-Fi", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
                    { label: "Upbeat", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
                    { label: "Corporate", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
                  ].map((bg) => (
                    <button key={bg.label} onClick={() => setBackgroundMusic(bg.url)}
                      className={`flex-1 min-w-[60px] rounded-xl border-2 py-2 text-xs font-bold transition-all ${backgroundMusic === bg.url ? "border-primary bg-primary/5 text-primary" : "border-black/10 text-text-secondary hover:border-black/20"}`}>
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">TikTok Auto-Captions</label>
                <button
                  onClick={() => setAutoCaptions(!autoCaptions)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoCaptions ? 'bg-primary' : 'bg-black/20'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoCaptions ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Voice Settings */}
            <div className="rounded-2xl border border-black/5 bg-white shadow-sm p-6 space-y-4">
              <h2 className="font-heading text-lg font-bold flex items-center gap-2 mb-4 text-text-primary">
                <Volume2 className="h-5 w-5 text-primary" /> Voice
              </h2>
              
              <div className="grid grid-cols-2 gap-2">
                {VOICE_PROFILES.map((v) => {
                  const Icon = v.icon;
                  return (
                  <button key={v.id} onClick={() => setSelectedVoiceId(v.id)}
                    className={`flex items-center gap-2 rounded-xl border-2 p-2 text-left transition-all ${selectedVoiceId === v.id ? "border-primary bg-primary/5" : "border-black/5 hover:border-black/10 bg-bg-secondary"}`}>
                    <div className={`p-1.5 rounded-lg ${selectedVoiceId === v.id ? 'bg-primary/20 text-primary' : 'bg-black/5 text-text-secondary'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-text-primary">{v.name}</span>
                  </button>
                  );
                })}
              </div>

              <div className="pt-4">
                <button onClick={() => setShowAdvancedVoice(!showAdvancedVoice)} className="text-sm text-primary font-bold flex items-center gap-1 hover:text-primary-dark transition-colors">
                  {showAdvancedVoice ? "Hide" : "Show"} advanced voice settings
                </button>
                
                {showAdvancedVoice && (
                  <div className="mt-4 space-y-6 bg-bg-secondary p-6 py-8 rounded-[24px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <VoiceSlider label="Speed" value={voiceSettings.speed} min={0.5} max={2.0} step={0.05} onChange={(v) => setVoiceSettings({ ...voiceSettings, speed: v })} />
                      <VoiceSlider label="Stability" value={voiceSettings.stability} min={0} max={1} step={0.05} onChange={(v) => setVoiceSettings({ ...voiceSettings, stability: v })} />
                      <VoiceSlider label="Similarity" value={voiceSettings.similarity} min={0} max={1} step={0.05} onChange={(v) => setVoiceSettings({ ...voiceSettings, similarity: v })} />
                      <VoiceSlider label="Emotion" value={voiceSettings.styleExaggeration} min={0} max={1} step={0.05} onChange={(v) => setVoiceSettings({ ...voiceSettings, styleExaggeration: v })} />
                    </div>

                    <div className="border-t border-black/5 pt-6 space-y-4">
                      <div>
                        <label className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2 block">Voice Accent / Description</label>
                        <input 
                          type="text"
                          value={voiceSettings.voicePrompt || ""}
                          onChange={(e) => setVoiceSettings({ ...voiceSettings, voicePrompt: e.target.value })}
                          placeholder="e.g. A natural Nigerian accent, warm and professional"
                          className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2 block">Clone Your Voice (10-30s Sample)</label>
                        <div className="relative group">
                          <input
                            type="file"
                            accept="audio/mp3,audio/wav,audio/mpeg"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setUploadingVoice(true);
                              try {
                                const fd = new FormData();
                                fd.append("file", file);
                                fd.append("folder", "voices");
                                const res = await fetch("/api/upload", { method: "POST", body: fd });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error ?? "Upload failed");
                                setVoiceSettings({ ...voiceSettings, voiceUrl: data.url });
                                success("Voice sample uploaded successfully!");
                              } catch (err) {
                                toastError((err as Error).message);
                              } finally {
                                setUploadingVoice(false);
                              }
                            }}
                          />
                          <div className={`flex items-center justify-between gap-3 p-4 rounded-xl border-2 border-dashed transition-all ${voiceSettings.voiceUrl ? "border-success/50 bg-success/5" : "border-black/10 bg-white hover:border-primary/50"}`}>
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${voiceSettings.voiceUrl ? "bg-success/20 text-success" : "bg-primary/10 text-primary"}`}>
                                {uploadingVoice ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-bold text-text-primary">
                                  {voiceSettings.voiceUrl ? "Voice Loaded" : "Upload Voice Sample"}
                                </p>
                                <p className="text-[10px] text-text-secondary">
                                  {voiceSettings.voiceUrl ? "Using your custom voice" : "MP3 or WAV, clear recording"}
                                </p>
                              </div>
                            </div>
                            {voiceSettings.voiceUrl && (
                              <button onClick={(e) => { e.stopPropagation(); setVoiceSettings({ ...voiceSettings, voiceUrl: undefined }); }} className="p-2 hover:bg-black/5 rounded-full text-text-secondary">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Actor Preview */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-black/5 flex justify-between items-center bg-bg-secondary/30">
              <h2 className="font-heading text-sm font-bold text-text-primary">Selected Actor</h2>
              <button onClick={() => setIsActorModalOpen(true)} className="text-xs font-bold text-primary hover:text-primary-dark bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                Change Actor
              </button>
            </div>
            
            <div className="relative aspect-[3/4] bg-bg-secondary w-full">
              {selectedAvatar ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedAvatar.thumbnailUrl} alt={selectedAvatar.name} className="absolute inset-0 w-full h-full object-cover" />
                  
                  {/* Preview Voice Overlay Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                     <button
                        onClick={() => previewVoice(selectedAvatar)}
                        disabled={previewingVoice}
                        className="h-16 w-16 rounded-full bg-white/90 shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        {previewingVoice && playingSampleId === selectedAvatar.id ? (
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        ) : playingSampleId === selectedAvatar.id ? (
                          <Pause className="h-6 w-6 fill-primary text-primary" />
                        ) : (
                          <Play className="h-6 w-6 fill-primary text-primary ml-1" />
                        )}
                      </button>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-12">
                    <h3 className="text-2xl font-bold text-white">{selectedAvatar.name}</h3>
                    <p className="text-white/80 text-sm capitalize mt-1">
                      {selectedAvatar.gender} · {selectedAvatar.age} · {selectedAvatar.situation}
                    </p>
                    <div className="flex gap-2 mt-3">
                      {selectedAvatar.isPro && <span className="flex items-center gap-1 rounded-md bg-warning/20 border border-warning/50 px-2 py-1 text-[10px] font-bold text-warning backdrop-blur-md"><Crown className="h-3 w-3"/> PRO</span>}
                      {selectedAvatar.isHD && <span className="rounded-md bg-accent/20 border border-accent/50 px-2 py-1 text-[10px] font-bold text-accent backdrop-blur-md">HD Quality</span>}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <User2 className="h-12 w-12 text-text-secondary/50" />
                  <p className="text-sm font-semibold text-text-secondary">No actor selected</p>
                  <button onClick={() => setIsActorModalOpen(true)} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white">Choose Actor</button>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-bg-secondary/30 text-xs text-text-secondary text-center">
              The actor will be generated using the settings and script provided on the left.
            </div>
          </div>
        </div>

      </div>

      {/* ACTOR LIBRARY MODAL */}
      {isActorModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6" onClick={() => setIsActorModalOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-black/5">
              <div>
                <h2 className="font-heading text-2xl font-bold text-text-primary">Actor Library</h2>
                <p className="text-sm text-text-secondary mt-1">Select an AI actor or upload your own photo.</p>
              </div>
              <button onClick={() => setIsActorModalOpen(false)} className="p-2 rounded-full hover:bg-bg-secondary text-text-secondary transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-bg-secondary/10">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                
                {/* Custom Upload Card */}
                <div className={`group relative overflow-hidden rounded-2xl border-2 transition-all flex flex-col ${selectedAvatar?.id.startsWith('custom-') ? "border-primary shadow-md ring-2 ring-primary/20" : "border-dashed border-black/20 hover:border-primary/50 bg-white"}`}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={async (e) => {
                      const rawFile = e.target.files?.[0];
                      if (!rawFile) return;
                      setSelectedAvatar(null);
                      setCustomActorImage("");
                      setUploadingActor(true);
                      try {
                        const { compressImage } = await import("@/lib/compressImage");
                        const file = await compressImage(rawFile, 3.5);
                        const fd = new FormData();
                        fd.append("file", file);
                        fd.append("folder", "uploads");
                        const res = await fetch("/api/upload", { method: "POST", body: fd });
                        const text = await res.text();
                        let data: { url?: string; error?: string } = {};
                        try { data = text ? JSON.parse(text) : {}; } catch { }
                        if (!res.ok) throw new Error(data.error ?? "Upload failed");
                        setCustomActorImage(data.url!);
                        const newAvatar = {
                          id: "custom-" + Date.now(),
                          name: "Custom Actor",
                          gender: customActorGender,
                          age: "young" as any,
                          situation: "studio" as any,
                          ethnicity: "custom",
                          thumbnailUrl: data.url!,
                          isPro: false,
                          isHD: true,
                          tags: []
                        };
                        setSelectedAvatar(newAvatar);
                        setIsActorModalOpen(false); // auto-close on success
                      } catch (err) {
                        toastError((err as Error).message);
                      } finally {
                        setUploadingActor(false);
                      }
                    }}
                  />
                  <div className="aspect-[3/4] relative flex flex-col items-center justify-center p-4">
                    {uploadingActor ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : customActorImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={customActorImage} alt="Custom" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm font-bold text-text-primary">Upload Photo</span>
                        <span className="text-[10px] text-text-secondary mt-1">Front-facing portrait</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Library Avatars */}
                {AVATAR_LIBRARY.map((avatar) => {
                  const isSelected = selectedAvatar?.id === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      onClick={() => {
                        setSelectedAvatar(avatar);
                        setIsActorModalOpen(false);
                      }}
                      className={`group relative overflow-hidden rounded-2xl border-2 transition-all text-left ${
                        isSelected ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-black/5 hover:border-primary/50 hover:shadow-md bg-white"
                      }`}
                    >
                      <div className="aspect-[3/4] relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatar.thumbnailUrl} alt={avatar.name} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <span className="text-white text-xs font-bold">Select Actor</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white">
                        <div className="text-sm font-bold text-text-primary truncate">{avatar.name}</div>
                        <div className="text-[10px] text-text-secondary capitalize truncate mt-0.5">
                          {avatar.gender} · {avatar.age}
                        </div>
                      </div>
                    </button>
                  );
                })}

              </div>
            </div>
          </div>
        </div>
      )}

      <TemplatesModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={(content) => {
          setScript(content);
        }}
      />
    </div>
  );
}

function VoiceSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-text-primary">{label}</span>
        <span className="text-xs font-mono text-text-secondary bg-black/5 px-2 py-1 rounded-md">{value.toFixed(2)}</span>
      </div>
      <div className="relative pt-1 px-4">
        {/* Invisible track but styled thumb to match screenshot precisely */}
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1 appearance-none bg-transparent cursor-pointer"
          style={{
            WebkitAppearance: 'none',
          }}
        />
        <style dangerouslySetInnerHTML={{__html: `
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #FF6B35;
            cursor: pointer;
            margin-top: -6px;
          }
          input[type=range]::-moz-range-thumb {
            height: 16px;
            width: 16px;
            border-radius: 50%;
            background: #FF6B35;
            cursor: pointer;
            border: none;
          }
          input[type=range]::-webkit-slider-runnable-track {
            width: 100%;
            height: 4px;
            background: rgba(255,255,255,0.02);
            border-radius: 2px;
          }
        `}} />
      </div>
    </div>
  );
}
