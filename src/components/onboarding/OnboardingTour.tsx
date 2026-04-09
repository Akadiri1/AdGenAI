"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Link2, Paintbrush, Crown, X, ChevronRight, ChevronLeft,
} from "lucide-react";

const STEPS = [
  {
    title: "Welcome to AdGenAI!",
    description: "Let's take a quick tour so you know how everything works. This will take 30 seconds.",
    icon: Sparkles,
    color: "bg-primary text-white",
    cta: "Let's go",
  },
  {
    title: "Create ads with Magic Mode",
    description: "Type your business in one sentence — AI generates 3 ad variants with copy, images, and platform-specific formatting. No marketing knowledge needed.",
    icon: Sparkles,
    color: "bg-gradient-to-r from-primary to-warning text-white",
    cta: "Next",
    link: "/create/magic",
  },
  {
    title: "Connect your accounts",
    description: "Link Instagram, Facebook, TikTok, and more. We'll post your ads automatically — you just pick the time.",
    icon: Link2,
    color: "bg-accent text-white",
    cta: "Next",
    link: "/connect",
  },
  {
    title: "Set up your brand",
    description: "Add your logo, brand colors, and business details. AI uses these to make every ad look like yours.",
    icon: Paintbrush,
    color: "bg-warning text-white",
    cta: "Next",
    link: "/settings/brand",
  },
  {
    title: "Upgrade for more power",
    description: "Free plan gives you 1 credit/day. Pro unlocks 5/day, Advanced Mode, no watermark, AI editing, and more music options. Starter starts at $49/month.",
    icon: Crown,
    color: "bg-secondary text-white",
    cta: "Start creating",
    link: "/settings/billing",
  },
];

export function OnboardingTour() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem("onboarding_done");
    if (!seen) setShow(true);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem("onboarding_done", "1");
  }

  function next() {
    if (step >= STEPS.length - 1) {
      dismiss();
      router.push("/dashboard");
    } else {
      setStep(step + 1);
    }
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  if (!show) return null;

  const s = STEPS[step];
  const Icon = s.icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
        >
          {/* Progress bar */}
          <div className="h-1 bg-bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            onClick={dismiss}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-text-secondary hover:bg-black/10 transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-8 pt-6">
            <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${s.color}`}>
              <Icon className="h-7 w-7" />
            </div>

            <h2 className="font-heading text-xl font-bold text-text-primary mb-2">{s.title}</h2>
            <p className="text-text-secondary leading-relaxed mb-6">{s.description}</p>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? "w-6 bg-primary" : "w-1.5 bg-bg-secondary"
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={prev}
                    className="flex h-10 items-center gap-1 rounded-xl border-2 border-black/10 px-3 text-sm font-semibold text-text-primary hover:bg-bg-secondary"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex h-10 items-center gap-1 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
                >
                  {s.cta}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {step === 0 && (
              <button
                onClick={dismiss}
                className="mt-4 w-full text-center text-xs text-text-secondary hover:text-text-primary"
              >
                Skip tour — I know what I&apos;m doing
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
