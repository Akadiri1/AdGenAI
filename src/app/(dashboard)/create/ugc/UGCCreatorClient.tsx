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
import { AVATAR_LIBRARY, SITUATIONS, filterAvatars, DEFAULT_VOICE_SETTINGS, type Avatar, type AvatarGender, type AvatarAge, type AvatarSituation, type VoiceSettings } from "@/lib/avatars";

type Step = "select-avatar" | "write-script" | "voice-settings" | "generate";

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
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "1:1" | "16:9">("9:16");
  const [generating, setGenerating] = useState(false);

  const [customActorImage, setCustomActorImage] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);

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

  function playSample(e: React.MouseEvent, avatar: Avatar) {
    e.preventDefault();
    e.stopPropagation();
    const sampleUrl = avatar.audioSamples?.us || avatar.audioSamples?.uk || avatar.audioSamples?.ng;
    if (!sampleUrl) return;

    if (playingSampleId === avatar.id) {
      audioRef.current?.pause();
      setPlayingSampleId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.src = sampleUrl;
      audioRef.current.play().catch(console.error);
      setPlayingSampleId(avatar.id);
    }
  }

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<AvatarGender | "">("");
  const [ageFilter, setAgeFilter] = useState<AvatarAge | "">("");
  const [situationFilter, setSituationFilter] = useState<AvatarSituation | "">("");

  const filteredAvatars = filterAvatars({
    gender: genderFilter || undefined,
    age: ageFilter || undefined,
    situation: situationFilter || undefined,
    search: searchQuery || undefined,
  });

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
            ? { customActorImageUrl: customActorImage }
            : { avatarLibraryId: selectedAvatar.id }),
          customScript: script,
          productName: productName || undefined,
          productOffer: productOffer || undefined,
          productDescription: productDescription || undefined,
          productImageUrls: productImages,
          visualInstructions: visualInstructions || undefined,
          voiceSettings,
          aspectRatio,
          targetSeconds: 15,
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
          {/* Search + Filters */}
          <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search actors by name, tag, or setting..."
                  className="w-full rounded-xl border-2 border-black/10 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value as AvatarGender | "")}
                className="rounded-xl border-2 border-black/10 bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-primary">
                <option value="">All genders</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
              <select value={ageFilter} onChange={(e) => setAgeFilter(e.target.value as AvatarAge | "")}
                className="rounded-xl border-2 border-black/10 bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-primary">
                <option value="">All ages</option>
                <option value="young">Young adult</option>
                <option value="middle">Middle aged</option>
                <option value="senior">Senior</option>
              </select>
            </div>

            <div className="mt-3 rounded-lg bg-accent/5 border border-accent/20 px-3 py-2 text-[11px] text-text-secondary">
              <strong className="text-accent">Note:</strong> these thumbnails are low-res for the picker only. When the ad is generated, <strong className="text-text-primary">Nano Banana</strong> upscales the actor + your product into a sharp 1024×1024 hero shot — final video output is full quality.
            </div>
            {/* Situation tags */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                onClick={() => setSituationFilter("")}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all ${
                  !situationFilter ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary hover:bg-black/5"
                }`}
              >
                All
              </button>
              {SITUATIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSituationFilter(situationFilter === s ? "" : s)}
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold capitalize transition-all ${
                    situationFilter === s ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary hover:bg-black/5"
                  }`}
                >
                  {s.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {/* Custom Avatar Upload Card */}
            <div className={`group relative overflow-hidden rounded-2xl border-2 transition-all flex flex-col ${
              selectedAvatar?.id.startsWith('custom-') ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-dashed border-black/15 hover:border-primary/50"
            }`}>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    toastError("File too large (max 5MB)");
                    return;
                  }
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("folder", "uploads");
                    const res = await fetch("/api/upload", { method: "POST", body: fd });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error ?? "Upload failed");
                    setCustomActorImage(data.url);
                    setSelectedAvatar({
                      id: "custom-" + Date.now(),
                      name: "Custom Actor",
                      gender: "female",
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
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                      <Upload className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider">Upload Actor</span>
                    <span className="text-[9px] text-text-secondary mt-1">Your own photo</span>
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-black/5 bg-white relative z-20">
                <div className="text-xs font-semibold text-text-primary truncate">Your Actor</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] text-text-secondary capitalize">Custom photo</span>
                </div>
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

          {filteredAvatars.length === 0 && (
            <div className="py-12 text-center text-text-secondary text-sm">
              No actors match your filters. Try different criteria.
            </div>
          )}

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
                <button
                  onClick={() => setStep("write-script")}
                  className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark"
                >
                  Next: Write script
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Write Script */}
      {step === "write-script" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <AIRephraseField
                kind="textarea"
                label="Script"
                hint={`${script.length} chars · ~${Math.round(script.split(/\s+/).length / 2.5)}s`}
                value={script}
                onChange={setScript}
                placeholder="Write what the actor says on camera. Make it natural — like a real person talking, not reading an ad. Include pauses, filler words, and genuine emotion.

Example: 'Okay so I just tried this thing and honestly... I'm kind of obsessed. Like, I've been looking for something like this for months and nothing came close...'"
                fieldType="script"
                rows={8}
              />
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-heading text-sm font-bold text-text-primary">Visuals (Optional)</h3>

              <MultiFileUpload
                values={productImages}
                onChange={setProductImages}
                label="Add product photo(s)"
                previewSize="lg"
                maxFiles={20}
              />

              {/* Product details — name + AI-assisted description + offer */}
              <div className="rounded-xl border border-black/5 bg-bg-secondary/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Product details</span>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-secondary">Product name</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. AeroPods Pro, Glow Serum, Smart Bottle"
                    className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <AIRephraseField
                  kind="textarea"
                  label="Description"
                  hint={`${productDescription.length} chars`}
                  value={productDescription}
                  onChange={setProductDescription}
                  placeholder="What is the product, who's it for, and what's the #1 benefit? The clearer this is, the better the script will be."
                  fieldType="body"
                  rows={4}
                  maxLength={500}
                  businessContext={productName ? `Product: ${productName}` : undefined}
                />
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-secondary">Offer (optional)</label>
                  <input
                    type="text"
                    value={productOffer}
                    onChange={(e) => setProductOffer(e.target.value)}
                    placeholder="e.g. 30% off launch week, Buy 2 get 1 free"
                    className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <AIRephraseField
                kind="textarea"
                label="Visual instructions / Prompts"
                hint={`${visualInstructions.length} chars`}
                value={visualInstructions}
                onChange={setVisualInstructions}
                placeholder="E.g., Show the product floating in space, or make the background a sunny beach. Tip: describe lighting, mood, camera angle, and what's happening."
                fieldType="imagePrompt"
                rows={4}
                maxLength={500}
              />
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
            <div className="flex items-center gap-2 mb-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold text-text-primary">Voice Controls</h2>
            </div>
            <p className="text-sm text-text-secondary">
              Fine-tune how {selectedAvatar?.name} sounds. These controls determine the naturalness and emotion of the delivery.
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
                  {isFree ? "Free — prompts only" : "Free — draft only (you confirm in Studio)"}
                </span>
              </div>
              {!isFree && (
                <div className="rounded-xl bg-accent/5 border border-accent/20 p-3 text-xs text-text-secondary">
                  We&rsquo;ll create a <strong className="text-text-primary">draft</strong> in Studio. Nothing is charged until you click <strong className="text-text-primary">Confirm &amp; Start</strong> there. Estimated ~24 credits for a 15s video.
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
