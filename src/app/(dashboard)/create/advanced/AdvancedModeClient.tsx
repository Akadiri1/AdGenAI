"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon, Video as VideoIcon, Upload, Sparkles } from "lucide-react";
import { PlatformPicker, type PlatformKey } from "@/components/create/PlatformPicker";
import { useToast } from "@/components/ui/Toast";
import { useCredits } from "@/components/CreditsProvider";
import { AIRephraseField } from "@/components/ui/AIRephraseField";

type AdType = "IMAGE" | "VIDEO";
type Framework = "AIDA" | "PAS" | "BAB" | "4U" | "FAB";
type AspectRatio = "1:1" | "9:16" | "16:9" | "4:5";

const FRAMEWORKS: { key: Framework; label: string; description: string }[] = [
  { key: "AIDA", label: "AIDA", description: "Attention · Interest · Desire · Action" },
  { key: "PAS", label: "PAS", description: "Problem · Agitate · Solution" },
  { key: "BAB", label: "BAB", description: "Before · After · Bridge" },
  { key: "4U", label: "4U", description: "Useful · Urgent · Unique · Ultra-specific" },
  { key: "FAB", label: "FAB", description: "Features · Advantages · Benefits" },
];

const MUSIC_CATEGORIES = [
  {
    category: "Popular",
    genres: [
      { key: "pop", label: "Pop" },
      { key: "hip-hop", label: "Hip-Hop" },
      { key: "r-and-b", label: "R&B" },
      { key: "indie", label: "Indie" },
      { key: "electronic", label: "Electronic" },
      { key: "edm", label: "EDM" },
    ],
  },
  {
    category: "Mood",
    genres: [
      { key: "cinematic", label: "Cinematic" },
      { key: "corporate", label: "Corporate" },
      { key: "lo-fi", label: "Lo-Fi" },
      { key: "ambient", label: "Ambient" },
      { key: "motivational", label: "Motivational" },
      { key: "energetic", label: "Energetic" },
      { key: "chill", label: "Chill" },
      { key: "dramatic", label: "Dramatic" },
    ],
  },
  {
    category: "Regional",
    genres: [
      { key: "afrobeats", label: "Afrobeats" },
      { key: "amapiano", label: "Amapiano" },
      { key: "highlife", label: "Highlife" },
      { key: "reggaeton", label: "Reggaeton" },
      { key: "k-pop", label: "K-Pop" },
      { key: "bollywood", label: "Bollywood" },
      { key: "latin", label: "Latin" },
    ],
  },
  {
    category: "Classic",
    genres: [
      { key: "rock", label: "Rock" },
      { key: "jazz", label: "Jazz" },
      { key: "classical", label: "Classical" },
      { key: "blues", label: "Blues" },
      { key: "country", label: "Country" },
      { key: "soul", label: "Soul" },
    ],
  },
  {
    category: "Trending",
    genres: [
      { key: "trending-tiktok", label: "TikTok Viral" },
      { key: "trending-reels", label: "Reels Trending" },
      { key: "trending-shorts", label: "Shorts Trending" },
    ],
  },
];

const ASPECTS: { key: AspectRatio; label: string; platform: string }[] = [
  { key: "1:1", label: "Square", platform: "Feed" },
  { key: "9:16", label: "Vertical", platform: "Story / Reel / TikTok" },
  { key: "16:9", label: "Landscape", platform: "YouTube" },
  { key: "4:5", label: "Portrait", platform: "Instagram feed" },
];

export function AdvancedModeClient() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { refreshCredits } = useCredits();

  const [type, setType] = useState<AdType>("IMAGE");
  const [platforms, setPlatforms] = useState<PlatformKey[]>(["INSTAGRAM", "FACEBOOK"]);
  const [headline, setHeadline] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [callToAction, setCallToAction] = useState("Shop now");
  const [script, setScript] = useState("");
  const [framework, setFramework] = useState<Framework>("AIDA");
  const [imagePrompt, setImagePrompt] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [musicGenre, setMusicGenre] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [saving, setSaving] = useState(false);

  const cost = type === "VIDEO" ? 2 : 1;
  const canSubmit = headline.trim().length > 0 && bodyText.trim().length > 0 && platforms.length > 0;

  // Context for AI Write — helps AI generate relevant content
  const businessCtx = [headline, bodyText].filter(Boolean).join(". ") || undefined;

  async function generate() {
    setSaving(true);
    try {
      const res = await fetch("/api/generate/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          platforms,
          headline,
          bodyText,
          callToAction,
          script: script || undefined,
          scriptFramework: type === "VIDEO" ? framework : undefined,
          imagePrompt: imagePrompt || undefined,
          customImageUrl: customImageUrl || undefined,
          musicGenre: musicGenre || undefined,
          aspectRatio,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.redirect) { router.push(data.redirect); return; }
        throw new Error(data.error ?? "Generation failed");
      }
      refreshCredits();
      const createdAds = data.ads ?? [data.ad];
      success(`Generated ${createdAds.length} variant${createdAds.length !== 1 ? "s" : ""} — review in Studio`);
      const firstId = createdAds[0]?.id;
      const otherIds = createdAds.slice(1).map((a: { id: string }) => a.id).join(",");
      router.push(firstId ? `/ads/${firstId}/studio${otherIds ? `?variants=${otherIds}` : ""}` : "/ads");
    } catch (err) {
      toastError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/create"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-text-primary">Advanced Mode</h1>
        <p className="text-text-secondary">Full control over copy, visuals, and targeting</p>
      </div>

      <div className="space-y-6">
        <Section title="Ad type">
          <div className="grid gap-3 sm:grid-cols-2">
            <TypeOption
              active={type === "IMAGE"}
              onClick={() => setType("IMAGE")}
              icon={<ImageIcon className="h-5 w-5" />}
              label="Image Ad"
              description="Static image with text overlays · 1 credit"
            />
            <TypeOption
              active={type === "VIDEO"}
              onClick={() => setType("VIDEO")}
              icon={<VideoIcon className="h-5 w-5" />}
              label="Video Ad"
              description="Animated video with music · 2 credits"
            />
          </div>
        </Section>

        <Section title="Platforms">
          <PlatformPicker selected={platforms} onChange={setPlatforms} />
        </Section>

        <Section title="Ad copy">
          <div className="space-y-4">
            <AIRephraseField
              label="Headline"
              hint={`${headline.length}/80 characters`}
              value={headline}
              onChange={setHeadline}
              maxLength={80}
              placeholder="Your hook — make people stop scrolling"
              fieldType="headline"
              businessContext={businessCtx}
            />
            <AIRephraseField
              kind="textarea"
              label="Body text"
              hint={`${bodyText.length}/300 characters`}
              value={bodyText}
              onChange={setBodyText}
              maxLength={300}
              placeholder="What problem does this solve? Why should they act now?"
              fieldType="body"
              businessContext={headline || undefined}
              rows={4}
            />
            <AIRephraseField
              label="Call to action"
              value={callToAction}
              onChange={setCallToAction}
              maxLength={50}
              placeholder="Shop now, Learn more, Get started free…"
              fieldType="cta"
              businessContext={businessCtx}
            />
          </div>
        </Section>

        {type === "VIDEO" && (
          <Section title="Video script">
            <div className="space-y-4">
              <div>
                <Label text="Framework" />
                <div className="grid gap-2 sm:grid-cols-2">
                  {FRAMEWORKS.map((f) => (
                    <label
                      key={f.key}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-all ${
                        framework === f.key ? "border-primary bg-primary/5" : "border-black/10 hover:border-black/20"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={framework === f.key}
                        onChange={() => setFramework(f.key)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-heading text-sm font-semibold text-text-primary">{f.label}</div>
                        <div className="text-xs text-text-secondary">{f.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <AIRephraseField
                kind="textarea"
                label="Script"
                hint="15-30 seconds, ~60-80 words"
                value={script}
                onChange={setScript}
                placeholder="Open with a hook. State the problem. Show the solution. End with a CTA."
                fieldType="script"
                businessContext={businessCtx}
                rows={5}
              />
            </div>
          </Section>
        )}

        <Section title="Visuals">
          <div className="space-y-4">
            <div>
              <Label text="Aspect ratio" />
              <div className="grid gap-2 sm:grid-cols-4">
                {ASPECTS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setAspectRatio(a.key)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      aspectRatio === a.key ? "border-primary bg-primary/5" : "border-black/10 hover:border-black/20"
                    }`}
                  >
                    <div className="font-heading text-sm font-bold text-text-primary">{a.key}</div>
                    <div className="text-xs text-text-secondary">{a.label}</div>
                    <div className="text-[10px] text-text-secondary mt-0.5">{a.platform}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label text="Image source" hint="Upload a URL or let AI generate" />
              <div className="space-y-3">
                <div className="rounded-xl border-2 border-dashed border-black/15 bg-bg-secondary/30 p-4">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    <Upload className="h-3.5 w-3.5" /> Custom image URL
                  </div>
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://yoursite.com/image.jpg"
                    className="w-full rounded-lg border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="text-center text-xs font-semibold text-text-secondary">OR</div>
                <div className="rounded-xl border-2 border-dashed border-black/15 bg-bg-secondary/30 p-4">
                  <AIRephraseField
                    kind="textarea"
                    label="AI image prompt"
                    value={imagePrompt}
                    onChange={setImagePrompt}
                    placeholder="A vibrant photo of ..."
                    fieldType="imagePrompt"
                    businessContext={businessCtx}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {type === "VIDEO" && (
          <Section title="Music">
            <div className="space-y-4">
              {MUSIC_CATEGORIES.map((cat) => (
                <div key={cat.category}>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {cat.category}
                    {cat.category === "Trending" && (
                      <span className="ml-2 rounded bg-danger/10 px-1.5 py-0.5 text-[9px] font-bold text-danger normal-case">
                        Hot
                      </span>
                    )}
                  </div>
                  <div className="grid gap-2 grid-cols-3 sm:grid-cols-4">
                    {cat.genres.map((g) => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => setMusicGenre(musicGenre === g.key ? "" : g.key)}
                        className={`rounded-xl border-2 px-3 py-2 text-xs font-semibold transition-all ${
                          musicGenre === g.key
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-black/10 hover:border-black/20 text-text-primary"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <div className="sticky bottom-4 rounded-2xl border border-black/5 bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm">
              <span className="text-text-secondary">Cost:</span>{" "}
              <strong className="text-text-primary">{cost} credit{cost !== 1 && "s"}</strong>
            </div>
            <button
              onClick={generate}
              disabled={!canSubmit || saving}
              className="h-12 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-all hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Creating..." : "Create ad"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-bold text-text-primary mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Label({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{text}</span>
      {hint && <span className="text-xs text-text-secondary">{hint}</span>}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, maxLength, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; maxLength?: number; hint?: string;
}) {
  return (
    <div>
      <Label text={label} hint={hint} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}

function TypeOption({
  active, onClick, icon, label, description,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
        active ? "border-primary bg-primary/5" : "border-black/10 bg-white hover:border-black/20"
      }`}
    >
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
        active ? "bg-primary text-white" : "bg-bg-secondary text-text-primary"
      }`}>{icon}</div>
      <div>
        <div className="font-heading font-bold text-text-primary">{label}</div>
        <div className="text-xs text-text-secondary">{description}</div>
      </div>
    </button>
  );
}
