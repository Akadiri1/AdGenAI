"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Search, Play, Mic, Volume2, Film,
  Loader2, Crown, SlidersHorizontal, User2, Upload, Pause, Wand2, Sparkles, Check, X
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useCredits } from "@/components/CreditsProvider";
import { AIRephraseField } from "@/components/ui/AIRephraseField";
import { MultiFileUpload } from "@/components/ui/MultiFileUpload";
import { FileUpload } from "@/components/ui/FileUpload";
import { AVATAR_LIBRARY, DEFAULT_VOICE_SETTINGS, type Avatar, type VoiceSettings } from "@/lib/avatars";

type Step = "select-avatar" | "write-script" | "voice-settings" | "generate";

type Duration = 5 | 10 | 15 | 30 | 60;

/** Mirror of server-side cost math (start-generation + finalize). */
function estimateCredits(targetSeconds: Duration): {
  sceneCount: number;
  render: number;
  finalize: number;
  total: number;
  renderMinutes: string; // e.g. "~2", "~5–7"
} {
  const sceneCount = targetSeconds <= 10 ? 1 : Math.max(2, Math.min(6, Math.round(targetSeconds / 6)));
  const render = targetSeconds + sceneCount * 3;
  const finalize = 5 + sceneCount * 2;
  // Each Kling clip ~45-60s + composite ~10s. Scenes run sequentially. Finalize adds ~90s (TTS + concat + lipsync).
  const minPerScene = 1;          // Kling best case
  const maxPerScene = 1.5;        // worst case
  const finalizeMin = 1.5;
  const finalizeMax = 2.5;
  const lo = Math.ceil(sceneCount * minPerScene + finalizeMin);
  const hi = Math.ceil(sceneCount * maxPerScene + finalizeMax);
  const renderMinutes = lo === hi ? `~${lo}` : `~${lo}–${hi}`;
  return { sceneCount, render, finalize, total: render + finalize, renderMinutes };
}

const DURATIONS: Duration[] = [5, 10, 15, 30, 60];

// ElevenLabs voice profiles — cover all main UGC creator types
const VOICE_PROFILES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah",   gender: "female" as const, description: "Young woman · warm & friendly",     emoji: "👩" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily",    gender: "female" as const, description: "Young woman · upbeat & energetic",  emoji: "💃" },
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel",  gender: "female" as const, description: "Mature woman · calm & trusted",     emoji: "👩‍💼" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian",   gender: "male"   as const, description: "Young man · deep & confident",      emoji: "👨" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam",    gender: "male"   as const, description: "Young man · casual & friendly",    emoji: "🧑" },
  { id: "pqHfZKP75CvOlQylNhV4", name: "Bill",    gender: "male"   as const, description: "Mature man · authoritative",        emoji: "👨‍💼" },
];

export function UGCCreatorClient({ isFree = false }: { isFree?: boolean } = {}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { refreshCredits } = useCredits();

  const [step, setStep] = useState<Step>("select-avatar");
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [script, setScript] = useState("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [visualInstructions, setVisualInstructions] = useState("");
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("EXAVITQu4vr4xnSDxMaL");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "1:1" | "16:9">("9:16");
  const [targetSeconds, setTargetSeconds] = useState<Duration>(15);
  const [generating, setGenerating] = useState(false);

  const cost = estimateCredits(targetSeconds);

  const [customActorImage, setCustomActorImage] = useState("");
  const [customActorGender, setCustomActorGender] = useState<"female" | "male">("female");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [previewingVoice, setPreviewingVoice] = useState(false);

  const [productName, setProductName] = useState("");
  const [productOffer, setProductOffer] = useState("");
  const [productDescription, setProductDescription] = useState("");

  const BACKGROUND_SUGGESTIONS = [
    { label: "Modern Kitchen", prompt: "In a sleek, modern kitchen with marble countertops and warm lighting." },
    { label: "Home Office", prompt: "Sitting at a clean, professional home office desk with a laptop and plants." },
    { label: "Sunny Beach", prompt: "Standing on a beautiful tropical beach with white sand and turquoise water." },
    { label: "Luxury Studio", prompt: "In a high-end professional photo studio with softbox lighting and a solid gray background." },
    { label: "Cozy Living Room", prompt: "In a warm, inviting living room with a soft sofa and natural sunlight." },
  ];

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

  const filteredAvatars = AVATAR_LIBRARY;

  async function generate() {
    if (!selectedAvatar || !script.trim()) return;
    setGenerating(true);
    try {
      const isCustomActor = selectedAvatar.id.startsWith("custom-");
      const res = await fetch("/api/generate/ecommerce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Actor: custom upload OR library avatar
          ...(isCustomActor
            ? { customActorImageUrl: customActorImage, customActorGender }
            : { avatarLibraryId: selectedAvatar.id }),
          customScript: script,
          productName: productName || undefined,
          productOffer: productOffer || undefined,
          productDescription: productDescription || undefined,
          productImageUrls: productImages,
          visualInstructions: visualInstructions || undefined,
          voiceSettings: { ...voiceSettings, voiceId: selectedVoiceId },
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
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-text-primary">AI UGC Creator</h1>
        <p className="text-text-secondary mt-1">Pick an AI actor, write a script, and generate a realistic UGC video ad</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: "select-avatar", label: "1. Pick actor", icon: User2 },
          { key: "write-script", label: "2. Script & Visuals", icon: Film },
          { key: "voice-settings", label: "3. Voice settings", icon: Volume2 },
          { key: "generate", label: "4. Generate", icon: Play },
        ].map((s, i) => {
          const Icon = s.icon;
          const isActive = step === s.key;
          const stepOrder = ["select-avatar", "write-script", "voice-settings", "generate"];
          const isPast = stepOrder.indexOf(step) > i;
          return (
            <button
              key={s.key}
              onClick={() => {
                if (s.key === "select-avatar") setStep("select-avatar");
                else if (s.key === "write-script" && selectedAvatar) setStep("write-script");
                else if (s.key === "voice-settings" && script.trim()) setStep("voice-settings");
                else if (s.key === "generate" && script.trim()) setStep("generate");
              }}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                isActive ? "bg-primary text-white" : isPast ? "bg-primary/10 text-primary" : "bg-bg-secondary text-text-secondary"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step 1: Avatar Selection */}
      {step === "select-avatar" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm space-y-3">
            <div className="font-heading font-bold text-text-primary">Upload your photo — the AI animates you speaking</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-start gap-1.5">
                <span className="text-success font-bold mt-0.5">✓</span>
                <span className="text-text-secondary">Front-facing, looking at camera</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-success font-bold mt-0.5">✓</span>
                <span className="text-text-secondary">Good lighting — daylight or ring light</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-success font-bold mt-0.5">✓</span>
                <span className="text-text-secondary">Simple or plain background</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-success font-bold mt-0.5">✓</span>
                <span className="text-text-secondary">Any resolution — AI auto-enhances before generating</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-danger font-bold mt-0.5">✗</span>
                <span className="text-text-secondary">Sunglasses or face covered</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-danger font-bold mt-0.5">✗</span>
                <span className="text-text-secondary">Dark, blurry or backlit photos</span>
              </div>
            </div>
            <p className="text-[10px] text-text-secondary">Any photo works — the AI automatically sharpens and upscales it before generating. Focus on lighting and angle, not resolution.</p>
          </div>

          {/* Avatar grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {/* Custom Avatar Upload Card */}
            <div className={`group relative overflow-hidden rounded-2xl border-2 transition-all flex flex-col ${
              selectedAvatar?.id.startsWith('custom-') ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-dashed border-black/15 hover:border-primary/50"
            }`}>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={async (e) => {
                  const rawFile = e.target.files?.[0];
                  if (!rawFile) return;
                  try {
                    // Auto-compress before upload — bypasses Vercel 4.5MB limit
                    const { compressImage } = await import("@/lib/compressImage");
                    const file = await compressImage(rawFile, 3.5);
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("folder", "uploads");
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    const text = await res.text();
                    let data: { url?: string; error?: string } = {};
                    try { data = text ? JSON.parse(text) : {}; } catch { /* non-JSON body */ }
                    if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status}): ${text.slice(0, 200) || "empty body"}`);
                    if (!data.url) throw new Error("Upload succeeded but returned no URL");
                    setCustomActorImage(data.url);
                    setSelectedAvatar({
                      id: "custom-" + Date.now(),
                      name: "Custom Actor",
                      gender: customActorGender,
                      age: "young",
                      situation: "studio",
                      ethnicity: "custom",
                      thumbnailUrl: data.url,
                      isPro: false,
                      isHD: true,
                      tags: []
                    });
                  } catch (err) {
                    toastError((err as Error).message);
                  }
                }}
              />
              <div className="aspect-[3/4] bg-bg-secondary/30 relative flex flex-col items-center justify-center">
                {customActorImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={customActorImage} alt="Custom" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center p-2 text-center">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                      <Upload className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider">Tap to upload</span>
                    <span className="text-[9px] text-text-secondary mt-1">JPG / PNG / WebP</span>
                  </div>
                )}
                {customActorImage && (
                  <div className="absolute top-2 right-2 rounded-md bg-success text-white text-[9px] font-bold px-1.5 py-0.5">
                    ✓ Ready
                  </div>
                )}
                {customActorImage && (
                  <div className="absolute bottom-2 left-2 right-2 rounded-md bg-black/60 text-white text-[8px] font-semibold px-1.5 py-1 text-center backdrop-blur-sm">
                    AI will auto-enhance before generating
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-black/5 bg-white relative z-20">
                <div className="text-xs font-semibold text-text-primary truncate">
                  {customActorImage ? "Photo uploaded" : "Your photo"}
                </div>
                {customActorImage ? (
                  <div className="flex gap-1 mt-1.5 pointer-events-auto z-40 relative" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomActorGender("female");
                        if (selectedAvatar?.id.startsWith("custom-")) {
                          setSelectedAvatar({ ...selectedAvatar, gender: "female" });
                        }
                      }}
                      className={`flex-1 rounded-md py-0.5 text-[9px] font-bold transition-colors ${customActorGender === "female" ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary"}`}
                    >
                      ♀ Female
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomActorGender("male");
                        if (selectedAvatar?.id.startsWith("custom-")) {
                          setSelectedAvatar({ ...selectedAvatar, gender: "male" });
                        }
                      }}
                      className={`flex-1 rounded-md py-0.5 text-[9px] font-bold transition-colors ${customActorGender === "male" ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary"}`}
                    >
                      ♂ Male
                    </button>
                  </div>
                ) : (
                  <div className="text-[9px] text-text-secondary mt-0.5">Front-facing, good light</div>
                )}
              </div>
              {selectedAvatar?.id.startsWith('custom-') && (
                <div className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none z-30" />
              )}
            </div>

            {filteredAvatars.map((avatar) => {
              const isSelected = selectedAvatar?.id === avatar.id;
              return (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`group relative overflow-hidden rounded-2xl border-2 transition-all ${
                    isSelected ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-black/5 hover:border-black/20 hover:shadow-md"
                  }`}
                >
                  <div className="aspect-[3/4] bg-gradient-to-br from-bg-secondary via-secondary/10 to-primary/10">
                    {avatar.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar.thumbnailUrl} alt={avatar.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <User2 className="h-8 w-8 text-text-secondary/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-semibold text-text-primary truncate">{avatar.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {avatar.isPro && <Crown className="h-3 w-3 text-warning" />}
                      {avatar.isHD && <span className="text-[8px] font-bold text-accent">HD</span>}
                      <span className="text-[9px] text-text-secondary capitalize">{avatar.situation}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>



          {selectedAvatar && (
            <div className="sticky bottom-20 sm:bottom-4 rounded-2xl border border-black/5 bg-white p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-bg-secondary overflow-hidden">
                    {selectedAvatar.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedAvatar.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><User2 className="h-5 w-5 text-text-secondary" /></div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{selectedAvatar.name} selected</div>
                    <div className="text-xs text-text-secondary capitalize">{selectedAvatar.gender} · {selectedAvatar.age} · {selectedAvatar.situation}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => previewVoice(selectedAvatar!)}
                    disabled={previewingVoice}
                    title="Hear this actor's voice"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black/10 bg-white text-text-secondary hover:bg-bg-secondary hover:text-primary disabled:opacity-50 transition-colors"
                  >
                    {previewingVoice && playingSampleId === selectedAvatar?.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : playingSampleId === selectedAvatar?.id
                        ? <Pause className="h-4 w-4" />
                        : <Volume2 className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setStep("write-script")}
                    className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark"
                  >
                    Next: Write script
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Write Script */}
      {step === "write-script" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {/* Script writing guidance */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="font-heading font-bold text-text-primary mb-1 text-sm">Write the script yourself for best results</div>
              <p className="text-xs text-text-secondary leading-relaxed">
                The AI Write button gives a generic output. <strong className="text-text-primary">You know your product, your audience, and your voice better than any AI.</strong> Write like you're sending a voice note to a friend — casual, honest, specific.
              </p>
              <div className="mt-2 text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">Use AI Write/Rewrite</span> only to fix awkward sentences or try a different angle — not to write the whole thing.
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              {/* Live script length indicator */}
              {script.trim() && (() => {
                const wordCount = script.trim().split(/\s+/).length;
                const estimatedSecs = Math.round(wordCount / 2.5);
                const maxWords = Math.round(targetSeconds * 2.5);
                const pct = Math.min((wordCount / maxWords) * 100, 100);
                const tooLong = wordCount > maxWords * 1.15;
                const slightlyOver = wordCount > maxWords && !tooLong;
                const perfect = wordCount >= maxWords * 0.7 && wordCount <= maxWords;
                return (
                  <div className={`mb-3 rounded-xl p-3 text-xs flex items-center justify-between gap-3 ${
                    tooLong ? "bg-danger/10 border border-danger/20" :
                    slightlyOver ? "bg-warning/10 border border-warning/20" :
                    perfect ? "bg-success/10 border border-success/20" :
                    "bg-bg-secondary border border-black/5"
                  }`}>
                    <div>
                      <span className={`font-bold ${tooLong ? "text-danger" : slightlyOver ? "text-warning" : perfect ? "text-success" : "text-text-secondary"}`}>
                        {tooLong ? "⚠️ Script too long" : slightlyOver ? "⚠️ Slightly over" : perfect ? "✅ Perfect length" : `📝 ${wordCount} words`}
                      </span>
                      <span className="text-text-secondary ml-2">
                        ~{estimatedSecs}s spoken · target {targetSeconds}s · max ~{maxWords} words
                      </span>
                      {tooLong && <div className="text-danger mt-0.5">The actor will be cut off. Shorten your script or increase the duration.</div>}
                      {slightlyOver && <div className="text-warning mt-0.5">A little long — trim a sentence or switch to {targetSeconds + (targetSeconds === 5 ? 5 : targetSeconds === 10 ? 5 : 15)}s.</div>}
                    </div>
                    <div className="flex-shrink-0 w-16">
                      <div className="h-1.5 w-full rounded-full bg-black/10 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${tooLong ? "bg-danger" : slightlyOver ? "bg-warning" : perfect ? "bg-success" : "bg-primary"}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-[9px] text-text-secondary text-right mt-0.5">{wordCount}/{maxWords}</div>
                    </div>
                  </div>
                );
              })()}
              <AIRephraseField
                kind="textarea"
                label="Script — write it in your own words"
                hint={`${script.trim().split(/\s+/).filter(Boolean).length} words · target ${targetSeconds}s`}
                value={script}
                onChange={setScript}
                placeholder={`Write exactly what you want the actor to say. Be specific about your product and who it's for.

Good example:
"I've been dealing with [problem] for months. Tried everything. Then I found [product] and honestly... I don't know how I lived without it. Three weeks in and [specific result]. Link in bio if you want to try it."

Bad example:
"Check out this amazing product that will transform your life and elevate your journey to the next level."`}
                fieldType="script"
                rows={8}
              />
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm space-y-4">
              <div>
                <h3 className="font-heading text-sm font-bold text-text-primary">Upload your product photos</h3>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Upload photos of <strong className="text-text-primary">what you're selling</strong> — clothes, skincare, food, gadgets, anything. The AI will composite your actor <strong className="text-text-primary">holding, wearing, or using</strong> the product in the video.
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-text-secondary">
                  <span className="rounded-md bg-bg-secondary px-2 py-0.5">👗 Clothing → actor wears it</span>
                  <span className="rounded-md bg-bg-secondary px-2 py-0.5">💄 Skincare → actor holds/applies it</span>
                  <span className="rounded-md bg-bg-secondary px-2 py-0.5">📱 Gadgets → actor shows it to camera</span>
                  <span className="rounded-md bg-bg-secondary px-2 py-0.5">🍔 Food → actor holds/eats it</span>
                </div>
                <p className="mt-2 text-[10px] text-text-secondary">
                  <strong className="text-text-primary">Best results:</strong> flat lay on white background, or hanger shot. Multiple angles = better compositing. Skip this if you don't have a product — the actor will just talk to camera.
                </p>
              </div>

              <div>
                <MultiFileUpload
                  values={productImages}
                  onChange={setProductImages}
                  label="Add product photo(s) — up to 20 images"
                  previewSize="lg"
                  maxFiles={20}
                />
                {productImages.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                      How should the actor use this product?
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "👕 Wear it", prompt: "The actor is wearing the product. Show the full outfit clearly." },
                        { label: "🤲 Hold it", prompt: "The actor holds the product naturally toward camera." },
                        { label: "💄 Apply it", prompt: "The actor applies or uses the product on themselves." },
                        { label: "📦 Unbox it", prompt: "The actor holds up and shows the product packaging." },
                        { label: "✋ Show it off", prompt: "The actor displays the product prominently in frame." },
                      ].map((chip) => (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={() => setVisualInstructions(chip.prompt)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                            visualInstructions === chip.prompt
                              ? "bg-primary text-white"
                              : "bg-bg-secondary text-text-secondary hover:bg-black/10"
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-text-secondary">
                      Pick one or write your own in Visual Instructions below. The AI will composite your actor with the product using this instruction.
                    </p>
                  </div>
                )}
              </div>

              {/* Product details */}
              <div className="rounded-xl border border-black/5 bg-bg-secondary/30 p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Tell the AI about your product</span>
                </div>

                {/* Product name */}
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Product name <span className="text-text-secondary/60 normal-case font-normal">— what is it called?</span>
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Midnight Temptress Dress, Glow Face Serum, Nike Air Max"
                    className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>

                {/* Description */}
                <AIRephraseField
                  kind="textarea"
                  label="Product description — what makes it special?"
                  hint={`${productDescription.length} chars`}
                  value={productDescription}
                  onChange={setProductDescription}
                  placeholder={`Describe your product in plain words. Include:
• What it is and what it does
• Who it's for (women in their 30s? young men? new mums?)
• The #1 reason someone should buy it

Example: "A custom-made velvet evening dress for Nigerian women who want to stand out at weddings and events. Made to your exact measurements — no more dresses that don't fit your body."`}
                  fieldType="body"
                  rows={5}
                  maxLength={500}
                  businessContext={productName ? `Product: ${productName}` : undefined}
                />

                {/* Offer */}
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                    Special offer <span className="text-text-secondary/60 normal-case font-normal">— optional, but boosts conversions</span>
                  </label>
                  <input
                    type="text"
                    value={productOffer}
                    onChange={(e) => setProductOffer(e.target.value)}
                    placeholder="e.g. Free delivery this week · First 10 orders get 20% off · Pay on delivery available"
                    className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                  <p className="mt-1 text-[10px] text-text-secondary">The AI will include this offer in the script and CTA. Leave blank if no current offer.</p>
                </div>
              </div>

              {/* Visual instructions explainer */}
              <div className="space-y-3">
                <div>
                  <div className="font-heading font-bold text-sm text-text-primary mb-0.5">
                    Visual Instructions — describe what you want to SEE in the video
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    This controls the <strong className="text-text-primary">background, setting, lighting, and what the actor is doing</strong> in each scene. Think of it as directing a short film — tell the AI where the actor is, what mood you want, and what movement or action you expect.
                  </p>
                </div>

                {/* Quick-pick categories */}
                <div className="rounded-xl border border-black/5 bg-bg-secondary/30 p-3 space-y-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Quick picks — tap to use</div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-semibold text-text-secondary">📍 Location / Background</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { t: "Lagos apartment", v: "Bright modern Lagos apartment, large windows, warm afternoon light, clean and minimal." },
                        { t: "Outdoor rooftop", v: "Outdoor rooftop terrace, city skyline in background, golden hour sunset, warm cinematic light." },
                        { t: "White studio", v: "Clean white studio backdrop, soft professional lighting, no distractions." },
                        { t: "Luxury bedroom", v: "Elegant bedroom with warm ambient lighting, luxurious bedding in background." },
                        { t: "Busy street", v: "Busy Nigerian street market in background, natural daylight, energetic and authentic feel." },
                      ].map((c) => (
                        <button key={c.t} type="button"
                          onClick={() => setVisualInstructions(prev => prev ? `${prev} ${c.v}` : c.v)}
                          className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-[10px] font-semibold text-text-secondary hover:border-primary hover:text-primary transition-colors">
                          {c.t}
                        </button>
                      ))}
                    </div>

                    <div className="text-[10px] font-semibold text-text-secondary mt-1">🎬 Actor action / movement</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { t: "Talks to camera", v: "Actor speaks directly to camera naturally, confident and relaxed, gestures with hands." },
                        { t: "Slow spin", v: "Actor does a slow confident spin showing off the full outfit, looking over shoulder at camera." },
                        { t: "Walk toward camera", v: "Actor walks confidently toward camera, full body visible, natural movement." },
                        { t: "Holds product up", v: "Actor holds the product at chest height, looks at it then back at camera with a smile." },
                        { t: "Unboxing reveal", v: "Actor opens packaging slowly and reacts with genuine excitement when seeing the product." },
                      ].map((c) => (
                        <button key={c.t} type="button"
                          onClick={() => setVisualInstructions(prev => prev ? `${prev} ${c.v}` : c.v)}
                          className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-[10px] font-semibold text-text-secondary hover:border-primary hover:text-primary transition-colors">
                          {c.t}
                        </button>
                      ))}
                    </div>

                    <div className="text-[10px] font-semibold text-text-secondary mt-1">💡 Lighting mood</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { t: "Warm & cozy", v: "Warm soft lighting, golden tones, intimate and welcoming feel." },
                        { t: "Bright & clean", v: "Bright natural daylight, clean and fresh, high energy." },
                        { t: "Luxury & dramatic", v: "Cinematic dramatic lighting, deep shadows, rich and luxurious mood." },
                        { t: "Natural daylight", v: "Soft natural window light, authentic and real, no harsh shadows." },
                      ].map((c) => (
                        <button key={c.t} type="button"
                          onClick={() => setVisualInstructions(prev => prev ? `${prev} ${c.v}` : c.v)}
                          className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-[10px] font-semibold text-text-secondary hover:border-primary hover:text-primary transition-colors">
                          {c.t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <AIRephraseField
                  kind="textarea"
                  label="Or write your own instructions"
                  hint={`${visualInstructions.length} chars`}
                  value={visualInstructions}
                  onChange={setVisualInstructions}
                  placeholder={`Combine location + action + lighting in one description. Example:
"Bright modern Lagos apartment, warm afternoon light. Actor does a slow confident spin showing the dress, then turns to face camera and gestures toward it. Cinematic, luxurious mood."`}
                  fieldType="imagePrompt"
                  rows={3}
                  maxLength={500}
                />
                {visualInstructions && (
                  <button type="button" onClick={() => setVisualInstructions("")}
                    className="text-[10px] text-text-secondary hover:text-danger transition-colors">
                    ✕ Clear all
                  </button>
                )}
              </div>

            </div>

          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Selected actor</div>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-xl bg-bg-secondary overflow-hidden flex-shrink-0 ring-2 ring-primary/20">
                  {selectedAvatar?.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedAvatar.thumbnailUrl} alt={selectedAvatar.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><User2 className="h-6 w-6 text-text-secondary" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-text-primary truncate">{selectedAvatar?.name}</div>
                  <div className="text-[11px] text-text-secondary capitalize truncate">
                    {selectedAvatar?.gender} · {selectedAvatar?.age} · {selectedAvatar?.situation}
                  </div>
                  <button onClick={() => setStep("select-avatar")} className="text-xs text-primary hover:underline mt-0.5">Change actor</button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Aspect ratio</div>
              <div className="grid grid-cols-3 gap-1.5">
                {(["9:16", "1:1", "16:9"] as const).map((ar) => (
                  <button key={ar} onClick={() => setAspectRatio(ar)}
                    className={`rounded-lg border-2 py-2 text-xs font-semibold transition-all ${aspectRatio === ar ? "border-primary bg-primary/5 text-primary" : "border-black/10 text-text-secondary"}`}>
                    {ar}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Duration</div>
              <div className="grid grid-cols-5 gap-1.5">
                {DURATIONS.map((d) => {
                  const c = estimateCredits(d);
                  const isActive = targetSeconds === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTargetSeconds(d)}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 py-2 transition-all ${isActive ? "border-primary bg-primary/5 text-primary" : "border-black/10 text-text-secondary hover:border-black/20"}`}
                    >
                      <span className="text-sm font-bold leading-none">{d}s</span>
                      <span className={`mt-1 text-[9px] font-semibold leading-none ${isActive ? "text-primary" : "text-text-secondary"}`}>{c.total}cr</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[10px] text-text-secondary leading-relaxed">
                {targetSeconds <= 10 ? (
                  <>Single shot — one Kling clip, no scene cuts.</>
                ) : (
                  <>{cost.sceneCount} scenes · ~{Math.round(targetSeconds / cost.sceneCount)}s each</>
                )}
                {" "}· <strong className="text-text-primary">{cost.total} credits</strong>
                {" "}· <strong className="text-text-primary">{cost.renderMinutes} min</strong> render time
              </p>
            </div>

            <button
              onClick={() => setStep("voice-settings")}
              disabled={!script.trim()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
            >
              Next: Voice settings
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Voice Settings */}
      {step === "voice-settings" && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-lg font-bold text-text-primary">Voice Controls</h2>
              </div>
              {selectedAvatar && (
                <button
                  type="button"
                  onClick={() => previewVoice(selectedAvatar)}
                  disabled={previewingVoice}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all disabled:opacity-60 ${
                    playingSampleId === selectedAvatar.id
                      ? "bg-primary text-white"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {previewingVoice && playingSampleId === selectedAvatar.id ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...</>
                  ) : playingSampleId === selectedAvatar.id ? (
                    <><Pause className="h-3.5 w-3.5" /> Stop</>
                  ) : (
                    <><Volume2 className="h-3.5 w-3.5" /> Preview Voice</>
                  )}
                </button>
              )}
            </div>
            {/* Voice picker */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Choose a voice</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {VOICE_PROFILES.map((v) => {
                  const isSelected = selectedVoiceId === v.id;
                  return (
                    <div key={v.id}
                      className={`relative rounded-xl border-2 p-2.5 cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/5" : "border-black/10 hover:border-black/20"}`}
                      onClick={() => setSelectedVoiceId(v.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">{v.emoji}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedVoiceId(v.id); previewVoice({ ...selectedAvatar!, gender: v.gender, voiceId: v.id }); }}
                          disabled={previewingVoice}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-black/10 hover:bg-primary/10 hover:border-primary disabled:opacity-50"
                          title={`Preview ${v.name}`}
                        >
                          {previewingVoice && selectedVoiceId === v.id
                            ? <Loader2 className="h-3 w-3 animate-spin text-primary" />
                            : <Volume2 className="h-3 w-3 text-text-secondary" />}
                        </button>
                      </div>
                      <div className="text-xs font-bold text-text-primary">{v.name}</div>
                      <div className="text-[9px] text-text-secondary leading-tight mt-0.5">{v.description}</div>
                      {isSelected && <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-sm text-text-secondary">
              Fine-tune how the voice sounds with the controls below.
            </p>

            <VoiceSlider
              label="Speed"
              hint={voiceSettings.speed <= 0.8 ? "Slow & deliberate" : voiceSettings.speed >= 1.3 ? "Fast & energetic" : "Natural pace"}
              value={voiceSettings.speed}
              min={0.5} max={2.0} step={0.05}
              onChange={(v) => setVoiceSettings({ ...voiceSettings, speed: v })}
            />
            <VoiceSlider
              label="Stability"
              hint={voiceSettings.stability <= 0.3 ? "Very dynamic — varied & expressive" : voiceSettings.stability >= 0.7 ? "Very consistent — predictable delivery" : "Balanced — natural variation"}
              value={voiceSettings.stability}
              min={0} max={1} step={0.05}
              onChange={(v) => setVoiceSettings({ ...voiceSettings, stability: v })}
            />
            <VoiceSlider
              label="Similarity"
              hint="How closely the speech matches your written punctuation and pauses"
              value={voiceSettings.similarity}
              min={0} max={1} step={0.05}
              onChange={(v) => setVoiceSettings({ ...voiceSettings, similarity: v })}
            />
            <VoiceSlider
              label="Style exaggeration"
              hint={voiceSettings.styleExaggeration <= 0.2 ? "Subtle — calm delivery" : voiceSettings.styleExaggeration >= 0.6 ? "Dramatic — lots of emotion" : "Moderate emotion"}
              value={voiceSettings.styleExaggeration}
              min={0} max={1} step={0.05}
              onChange={(v) => setVoiceSettings({ ...voiceSettings, styleExaggeration: v })}
            />
          </div>

          {/* Speech-to-speech */}
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
            <div className="flex items-start gap-3">
              <Mic className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-heading font-bold text-text-primary mb-1">Speech-to-Speech (coming soon)</h3>
                <p className="text-sm text-text-secondary">
                  Record yourself reading the script with your exact intonation — AI will mimic your pacing, pauses, and emotion for the avatar. This is what makes UGC ads sound truly human.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("write-script")} className="flex h-11 items-center gap-1 rounded-xl border-2 border-black/10 px-4 text-sm font-semibold text-text-primary hover:bg-bg-secondary">
              Back
            </button>
            <button
              onClick={() => setStep("generate")}
              className="flex flex-1 h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Next: Review & generate
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Generate */}
      {step === "generate" && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-text-primary mb-4">Review your UGC ad</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-bg-secondary p-3">
                <span className="text-text-secondary">Actor</span>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg overflow-hidden bg-white flex-shrink-0">
                    {selectedAvatar?.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedAvatar.thumbnailUrl} alt={selectedAvatar.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <span className="font-semibold text-text-primary">{selectedAvatar?.name} ({selectedAvatar?.situation})</span>
                </div>
              </div>
              <div className="flex justify-between rounded-xl bg-bg-secondary p-3">
                <span className="text-text-secondary">Aspect ratio</span>
                <span className="font-semibold text-text-primary">{aspectRatio}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-bg-secondary p-3">
                <span className="text-text-secondary">Duration</span>
                <span className="font-semibold text-text-primary">
                  {targetSeconds}s · {cost.sceneCount === 1 ? "single shot" : `${cost.sceneCount} scenes`}
                </span>
              </div>
              <div className="flex justify-between rounded-xl bg-bg-secondary p-3">
                <span className="text-text-secondary">Render time</span>
                <span className="font-semibold text-text-primary">{cost.renderMinutes} min</span>
              </div>
              {selectedAvatar?.id.startsWith("custom-") && (
                <div className="flex items-center gap-2 rounded-xl bg-success/5 border border-success/20 p-3">
                  <span className="text-lg">✨</span>
                  <div>
                    <div className="text-xs font-bold text-success">AI photo enhancement included</div>
                    <div className="text-[10px] text-text-secondary">GFPGAN will auto-sharpen and 2× upscale your photo before generating — no extra cost</div>
                  </div>
                </div>
              )}
              <div className="flex justify-between rounded-xl bg-bg-secondary p-3">
                <span className="text-text-secondary">Speed / Stability / Emotion</span>
                <span className="font-semibold text-text-primary">{voiceSettings.speed.toFixed(1)}x / {(voiceSettings.stability * 100).toFixed(0)}% / {(voiceSettings.styleExaggeration * 100).toFixed(0)}%</span>
              </div>
              <div className="rounded-xl bg-bg-secondary p-3">
                <div className="text-text-secondary mb-1">Script</div>
                <div className="text-text-primary whitespace-pre-wrap">{script}</div>
              </div>
              <div className="flex justify-between rounded-xl bg-primary/5 border border-primary/20 p-3">
                <span className="text-text-secondary">Cost</span>
                <span className="font-semibold text-primary">
                  {isFree ? "Free — prompts only" : `~${cost.total} credits (charged at Confirm)`}
                </span>
              </div>
              {!isFree && (
                <div className="rounded-xl bg-accent/5 border border-accent/20 p-3 text-xs text-text-secondary">
                  We&rsquo;ll create a <strong className="text-text-primary">draft</strong> in Studio. Nothing is charged until you click <strong className="text-text-primary">Confirm &amp; Start</strong> there. Estimated <strong className="text-text-primary">{cost.total} credits</strong> for this {targetSeconds}s ad.
                </div>
              )}
              {isFree && (
                <div className="rounded-xl bg-warning/5 border border-warning/20 p-3 text-xs text-text-secondary">
                  You&rsquo;re on the free plan. We&rsquo;ll generate copy-paste-ready prompts you can drop into Kling, Veo, or Sora. Upgrade to Starter for real video output.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("voice-settings")} className="flex h-11 items-center gap-1 rounded-xl border-2 border-black/10 px-4 text-sm font-semibold text-text-primary hover:bg-bg-secondary">
              Back
            </button>
            <button
              onClick={generate}
              disabled={generating}
              className="flex flex-1 h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-warning text-sm font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {isFree ? "Generating prompts..." : "Building draft..."}</>
              ) : (
                <><Play className="h-4 w-4" /> {isFree ? "Generate Prompts" : "Build Draft → Studio"}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function VoiceSlider({ label, hint, value, min, max, step, onChange }: {
  label: string; hint: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-text-primary">{label}</span>
        <span className="text-xs font-mono text-text-secondary">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-bg-secondary cursor-pointer accent-primary"
      />
      <div className="mt-1 text-[10px] text-text-secondary">{hint}</div>
    </div>
  );
}
