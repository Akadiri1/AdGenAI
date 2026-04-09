"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, GripVertical, Upload, Sparkles, Wand2,
  Film, Loader2, Image as ImageIcon, ChevronUp, ChevronDown,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useCredits } from "@/components/CreditsProvider";
import { AIRephraseField } from "@/components/ui/AIRephraseField";

type Slide = {
  id: string;
  imageUrl: string;
  prompt: string;
  duration: number; // seconds this slide shows
};

const DURATIONS = [3, 4, 5, 6, 7, 8];

export function StoryboardClient({ credits }: { credits: number }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { refreshCredits } = useCredits();

  const [slides, setSlides] = useState<Slide[]>([
    { id: crypto.randomUUID(), imageUrl: "", prompt: "", duration: 5 },
  ]);
  const [headline, setHeadline] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [musicGenre, setMusicGenre] = useState("cinematic");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "1:1" | "16:9" | "4:5">("9:16");
  const [generating, setGenerating] = useState(false);
  const [uploadingSlide, setUploadingSlide] = useState<string | null>(null);

  const totalDuration = slides.reduce((sum, s) => sum + s.duration, 0);
  const cost = Math.max(1, Math.ceil(slides.length / 3)); // 1 credit per 3 slides

  function addSlide() {
    setSlides([...slides, { id: crypto.randomUUID(), imageUrl: "", prompt: "", duration: 5 }]);
  }

  function removeSlide(id: string) {
    if (slides.length <= 1) return;
    setSlides(slides.filter((s) => s.id !== id));
  }

  function updateSlide(id: string, updates: Partial<Slide>) {
    setSlides(slides.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }

  function moveSlide(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const arr = [...slides];
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    setSlides(arr);
  }

  async function uploadImage(slideId: string, file: File) {
    setUploadingSlide(slideId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "ads/storyboard");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      updateSlide(slideId, { imageUrl: data.url });
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setUploadingSlide(null);
    }
  }

  async function generateVideo() {
    const filledSlides = slides.filter((s) => s.imageUrl);
    if (filledSlides.length === 0) {
      toastError("Add at least one screenshot");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/generate/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slides: filledSlides.map((s) => ({
            imageUrl: s.imageUrl,
            prompt: s.prompt,
            duration: s.duration,
          })),
          headline,
          callToAction,
          musicGenre,
          aspectRatio,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      refreshCredits();
      success("Video ad created! Opening in Studio...");
      router.push(`/ads/${data.adId}/studio`);
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/create" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-text-primary">Screenshot to Video</h1>
        <p className="text-text-secondary mt-1">Upload screenshots, describe each scene, and AI turns them into a polished video ad</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Slides */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {slides.map((slide, i) => (
              <motion.div
                key={slide.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {/* Reorder controls */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <button onClick={() => moveSlide(i, "up")} disabled={i === 0}
                      className="text-text-secondary hover:text-text-primary disabled:opacity-30">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => moveSlide(i, "down")} disabled={i === slides.length - 1}
                      className="text-text-secondary hover:text-text-primary disabled:opacity-30">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Image upload */}
                  <div className="flex-shrink-0">
                    <label className="block cursor-pointer">
                      <div className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
                        slide.imageUrl ? "border-success" : "border-black/15 hover:border-primary"
                      }`}>
                        {uploadingSlide === slide.id ? (
                          <Loader2 className="h-6 w-6 text-text-secondary animate-spin" />
                        ) : slide.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={slide.imageUrl} alt={`Slide ${i + 1}`} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-text-secondary">
                            <Upload className="h-5 w-5" />
                            <span className="text-[9px] font-semibold">Upload</span>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(slide.id, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>

                  {/* Prompt + controls */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <AIRephraseField
                      kind="textarea"
                      label={`Scene ${i + 1} description`}
                      value={slide.prompt}
                      onChange={(v) => updateSlide(slide.id, { prompt: v })}
                      placeholder="Describe what's happening in this screenshot... e.g. 'Show the app dashboard with analytics, highlight the easy-to-use interface'"
                      fieldType="script"
                      rows={2}
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-text-secondary">Duration:</span>
                        <select
                          value={slide.duration}
                          onChange={(e) => updateSlide(slide.id, { duration: Number(e.target.value) })}
                          className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs outline-none focus:border-primary"
                        >
                          {DURATIONS.map((d) => <option key={d} value={d}>{d}s</option>)}
                        </select>
                      </div>
                      {slides.length > 1 && (
                        <button onClick={() => removeSlide(slide.id)} className="text-danger hover:bg-danger/10 rounded-lg p-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button
            onClick={addSlide}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/15 bg-white text-sm font-semibold text-text-secondary hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4" /> Add scene
          </button>
        </div>

        {/* Right: Settings + Generate */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm space-y-3">
            <h3 className="font-heading font-bold text-text-primary text-sm">Video settings</h3>

            <AIRephraseField
              label="Headline overlay"
              value={headline}
              onChange={setHeadline}
              placeholder="Your app, simplified."
              fieldType="headline"
              maxLength={80}
            />

            <AIRephraseField
              label="Call to action"
              value={callToAction}
              onChange={setCallToAction}
              placeholder="Try it free today"
              fieldType="cta"
              maxLength={40}
            />

            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">Music</div>
              <div className="grid grid-cols-3 gap-1.5">
                {["cinematic", "corporate", "electronic", "lo-fi", "pop", "hip-hop"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setMusicGenre(g)}
                    className={`rounded-lg border px-2 py-1.5 text-[10px] font-semibold capitalize transition-all ${
                      musicGenre === g ? "border-primary bg-primary/5 text-primary" : "border-black/10 text-text-secondary"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">Aspect ratio</div>
              <div className="grid grid-cols-4 gap-1.5">
                {(["9:16", "1:1", "16:9", "4:5"] as const).map((ar) => (
                  <button
                    key={ar}
                    onClick={() => setAspectRatio(ar)}
                    className={`rounded-lg border px-2 py-1.5 text-[10px] font-semibold transition-all ${
                      aspectRatio === ar ? "border-primary bg-primary/5 text-primary" : "border-black/10 text-text-secondary"
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Scenes</span>
                <span className="font-semibold text-text-primary">{slides.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total duration</span>
                <span className="font-semibold text-text-primary">{totalDuration}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Cost</span>
                <span className="font-semibold text-text-primary">{cost} credit{cost !== 1 && "s"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Your credits</span>
                <span className="font-semibold text-text-primary">{credits}</span>
              </div>
            </div>
          </div>

          <button
            onClick={generateVideo}
            disabled={generating || slides.every((s) => !s.imageUrl)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-warning text-sm font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creating video...</>
            ) : (
              <><Film className="h-4 w-4" /> Generate video ad</>
            )}
          </button>

          <p className="text-[10px] text-text-secondary text-center">
            AI assembles your screenshots into a video with Ken Burns zoom, text overlays, and music
          </p>
        </div>
      </div>
    </div>
  );
}
