"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlatformPicker, PLATFORMS, type PlatformKey } from "@/components/create/PlatformPicker";
import { useToast } from "@/components/ui/Toast";
import { useCredits } from "@/components/CreditsProvider";
import { AIRephraseField } from "@/components/ui/AIRephraseField";

type Step = 1 | 2 | 3 | 4;

export default function MagicModePage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const { refreshCredits } = useCredits();
  const [step, setStep] = useState<Step>(1);
  const [businessInput, setBusinessInput] = useState("");
  const [platforms, setPlatforms] = useState<PlatformKey[]>(["INSTAGRAM", "FACEBOOK"]);
  const [scheduleMode, setScheduleMode] = useState<"now" | "pick" | "ai">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const examples = [
    "I run a coffee shop in Brooklyn",
    "Vegan restaurant doing lunch delivery",
    "Online tutoring for high school math",
    "Handmade leather bags, ships worldwide",
  ];

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessInput,
          platforms,
          scheduledAt: scheduleMode === "pick" && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          postNow: scheduleMode === "now",
          generateImages: true,
          numVariants: 3,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.redirect) { router.push(data.redirect); return; }
        throw new Error(data.error ?? "Generation failed");
      }
      refreshCredits();
      success(`Generated ${data.ads.length} ad variant${data.ads.length !== 1 ? "s" : ""}!`);
      // Go to studio with all variant IDs so user can compare and pick
      const adIds = data.ads.map((a: { id: string }) => a.id);
      const firstAdId = adIds[0];
      const otherIds = adIds.slice(1).join(",");
      router.push(
        firstAdId
          ? `/ads/${firstAdId}/studio${otherIds ? `?variants=${otherIds}` : ""}`
          : `/ads?created=${data.ads.length}`,
      );
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  }

  const canNext =
    (step === 1 && businessInput.trim().length >= 3) ||
    (step === 2 && platforms.length > 0) ||
    (step === 3 && (scheduleMode !== "pick" || scheduledAt));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                  s <= step ? "bg-primary text-white" : "bg-bg-secondary text-text-secondary"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              {s < 4 && (
                <div className={`h-0.5 flex-1 transition-all ${s < step ? "bg-primary" : "bg-bg-secondary"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 text-sm font-semibold text-text-secondary">Step {step} of 4</div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm overflow-hidden">
        <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
        {step === 1 && (
          <div>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
              What&apos;s your business?
            </h2>
            <p className="text-text-secondary mb-6">
              One sentence is enough. Our AI figures out the rest.
            </p>
            <AIRephraseField
              kind="textarea"
              label="Describe your business"
              hint={`${businessInput.length}/500`}
              value={businessInput}
              onChange={setBusinessInput}
              maxLength={500}
              placeholder="I sell handmade candles online, shipping worldwide..."
              fieldType="generic"
              rows={3}
            />

            <div className="mt-6">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Or try an example
              </div>
              <div className="flex flex-wrap gap-2">
                {examples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setBusinessInput(ex)}
                    className="rounded-xl border border-black/10 bg-bg-secondary px-3 py-1.5 text-xs font-medium text-text-primary hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
              Where do you want to advertise?
            </h2>
            <p className="text-text-secondary mb-6">
              We&apos;ll auto-resize your ads for each platform.
            </p>
            <PlatformPicker selected={platforms} onChange={setPlatforms} />
            <div className="mt-4 text-sm text-text-secondary">
              Selected: <strong className="text-text-primary">{platforms.length}</strong> platform
              {platforms.length !== 1 && "s"}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
              When should we post?
            </h2>
            <p className="text-text-secondary mb-6">
              Pick a time, or let AI choose the best moment.
            </p>

            <div className="space-y-3">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-all ${
                  scheduleMode === "now" ? "border-primary bg-primary/5" : "border-black/10 hover:border-black/20"
                }`}
              >
                <input
                  type="radio"
                  name="schedule"
                  checked={scheduleMode === "now"}
                  onChange={() => setScheduleMode("now")}
                  className="mt-1"
                />
                <div>
                  <div className="font-heading font-semibold text-text-primary">Post now</div>
                  <div className="text-sm text-text-secondary">Publish to all selected platforms immediately</div>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-all ${
                  scheduleMode === "ai" ? "border-primary bg-primary/5" : "border-black/10 hover:border-black/20"
                }`}
              >
                <input
                  type="radio"
                  name="schedule"
                  checked={scheduleMode === "ai"}
                  onChange={() => setScheduleMode("ai")}
                  className="mt-1"
                />
                <div>
                  <div className="font-heading font-semibold text-text-primary">Let AI pick ✨</div>
                  <div className="text-sm text-text-secondary">We&apos;ll schedule at the best time for your audience</div>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-all ${
                  scheduleMode === "pick" ? "border-primary bg-primary/5" : "border-black/10 hover:border-black/20"
                }`}
              >
                <input
                  type="radio"
                  name="schedule"
                  checked={scheduleMode === "pick"}
                  onChange={() => setScheduleMode("pick")}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-heading font-semibold text-text-primary">Pick a date & time</div>
                  <div className="text-sm text-text-secondary mb-2">Choose exactly when to post</div>
                  {scheduleMode === "pick" && (
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full rounded-xl border-2 border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  )}
                </div>
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">
              Ready to create magic? ✨
            </h2>
            <p className="text-text-secondary mb-6">
              Review your settings, then AI will generate 3 ad variants.
            </p>

            <div className="space-y-4 rounded-2xl bg-bg-secondary p-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Business</div>
                <div className="text-text-primary">{businessInput}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Platforms</div>
                <div className="flex flex-wrap gap-1.5">
                  {platforms.map((p) => {
                    const info = PLATFORMS.find((x) => x.key === p);
                    return (
                      <span key={p} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-text-primary">
                        {info?.icon && <info.icon className="h-4 w-4" />} {info?.label}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Schedule</div>
                <div className="text-text-primary">
                  {scheduleMode === "now" && "Post now"}
                  {scheduleMode === "ai" && "AI picks best time"}
                  {scheduleMode === "pick" && scheduledAt && new Date(scheduledAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm text-text-primary">
              <strong className="text-primary">Cost:</strong> 1 credit for 3 ad variants
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-danger/10 border border-danger/20 p-4 text-sm text-danger">
                {error}
              </div>
            )}
          </div>
        )}

        </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((step - 1) as Step)}
              disabled={loading}
              className="h-12 rounded-xl border-2 border-black/10 bg-white px-6 text-sm font-semibold text-text-primary transition-all hover:bg-bg-secondary disabled:opacity-50"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((step + 1) as Step)}
              disabled={!canNext}
              className="flex-1 h-12 rounded-xl bg-primary text-sm font-semibold text-white transition-all hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 h-12 rounded-xl bg-primary text-sm font-semibold text-white transition-all hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? "Generating… this takes ~30 seconds" : "✨ Generate my ads"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
