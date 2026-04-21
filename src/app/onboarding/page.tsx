"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Sliders, Link2, Paintbrush, Crown, BarChart3,
  CalendarDays, Gift, ChevronRight, ChevronLeft,
} from "lucide-react";
import { Logo } from "@/components/Logo";

const STEPS = [
  {
    title: "Welcome to Famousli",
    subtitle: "Create professional ads in 30 seconds",
    description: "No marketing degree needed. Type your business in one sentence — our AI generates copy, images, video, music, and posts everything for you automatically.",
    icon: Sparkles,
    color: "from-primary to-warning",
    link: "/dashboard",
    linkLabel: "Go to Dashboard",
    visual: (
      <div className="grid grid-cols-3 gap-3 mt-6">
        <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-warning/20 flex items-center justify-center text-3xl">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div className="aspect-square rounded-2xl bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
          <Sliders className="h-8 w-8 text-secondary" />
        </div>
        <div className="aspect-square rounded-2xl bg-gradient-to-br from-accent/20 to-success/20 flex items-center justify-center">
          <BarChart3 className="h-8 w-8 text-accent" />
        </div>
      </div>
    ),
  },
  {
    title: "Magic Mode",
    subtitle: "Zero decisions required",
    description: "Type something like \"I sell handmade candles online\" and get 3 complete ad variants — headlines, body copy, images, hashtags, and platform-specific sizing. All in under 30 seconds.",
    icon: Sparkles,
    color: "from-primary to-accent",
    link: "/create/magic",
    linkLabel: "Try Magic Mode",
    visual: (
      <div className="mt-6 rounded-2xl bg-bg-secondary p-4">
        <div className="rounded-xl border-2 border-primary/20 bg-white p-3 text-sm text-text-primary font-mono">
          &ldquo;I run a coffee shop in Brooklyn&rdquo;
        </div>
        <div className="mt-3 flex gap-2">
          <div className="flex-1 rounded-lg bg-gradient-to-br from-primary to-warning h-16" />
          <div className="flex-1 rounded-lg bg-gradient-to-br from-secondary to-accent h-16" />
          <div className="flex-1 rounded-lg bg-gradient-to-br from-accent to-success h-16" />
        </div>
        <div className="mt-2 text-xs text-text-secondary text-center">Your ad generated instantly — fully editable after</div>
      </div>
    ),
  },
  {
    title: "Advanced Mode",
    subtitle: "Full creative control (Pro)",
    description: "Write your own copy, choose frameworks (AIDA, PAS, BAB), upload custom images, pick music genres, and tune every detail. AI Rewrite buttons let you polish any field instantly.",
    icon: Sliders,
    color: "from-secondary to-primary",
    link: "/create/advanced",
    linkLabel: "Try Advanced Mode",
    visual: (
      <div className="mt-6 space-y-2">
        {["Headline", "Body text", "Call to action", "Video script"].map((f) => (
          <div key={f} className="flex items-center justify-between rounded-xl bg-bg-secondary px-4 py-2.5">
            <span className="text-sm font-semibold text-text-primary">{f}</span>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">AI Rewrite</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Connect & Auto-Post",
    subtitle: "Link once, post everywhere",
    description: "Connect Instagram, Facebook, TikTok, WhatsApp, and more. Create an ad, pick a time — we upload, caption, and publish automatically. Schedule weeks of content in minutes.",
    icon: Link2,
    color: "from-accent to-secondary",
    link: "/connect",
    linkLabel: "Connect accounts",
    visual: (
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {["Instagram", "Facebook", "TikTok", "WhatsApp", "YouTube", "X", "LinkedIn"].map((p) => (
          <div key={p} className="rounded-xl bg-bg-secondary px-3 py-2 text-xs font-semibold text-text-primary">{p}</div>
        ))}
      </div>
    ),
  },
  {
    title: "Track & Optimize",
    subtitle: "Know what works",
    description: "Per-platform analytics show impressions, clicks, CTR, and ROI for every ad. The AI scores each variant so you only run winners. Your ROI calculator shows exactly how much you earned from every dollar spent.",
    icon: BarChart3,
    color: "from-success to-accent",
    link: "/analytics",
    linkLabel: "View analytics",
    visual: (
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Impressions", value: "12.4K" },
          { label: "Clicks", value: "847" },
          { label: "ROI", value: "+340%" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-bg-secondary p-3 text-center">
            <div className="font-heading text-lg font-bold text-text-primary">{s.value}</div>
            <div className="text-[10px] text-text-secondary">{s.label}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Set Up Your Brand (Required)",
    subtitle: "You must complete this before creating ads",
    description: "Tell us your business name, what you do, who your customers are, and your brand colors + voice. AI uses all of this to create ads that match your brand perfectly. This step is mandatory.",
    icon: Paintbrush,
    color: "from-warning to-primary",
    link: "/settings/brand",
    linkLabel: "Set up brand kit",
    visual: (
      <div className="mt-6 flex items-center gap-4 justify-center">
        <div className="h-14 w-14 rounded-xl bg-primary" />
        <div className="h-14 w-14 rounded-xl bg-secondary" />
        <div className="h-14 w-14 rounded-xl bg-accent" />
        <div className="h-14 w-14 rounded-xl border-2 border-dashed border-black/20 flex items-center justify-center text-text-secondary">
          <Paintbrush className="h-5 w-5" />
        </div>
      </div>
    ),
  },
  {
    title: "Refer & Earn",
    subtitle: "20% commission, forever",
    description: "Share your referral link. When someone subscribes, you earn 20% of every payment — monthly or yearly. Cash out anytime once you hit $10. No cap, no expiry.",
    icon: Gift,
    color: "from-primary to-danger",
    link: "/referral",
    linkLabel: "Get your referral link",
    visual: (
      <div className="mt-6 rounded-2xl bg-success/10 border border-success/20 p-4 text-center">
        <div className="font-heading text-2xl font-bold text-success">$9.80</div>
        <div className="text-xs text-text-secondary">per Starter monthly ($49)</div>
        <div className="mt-1 font-heading text-2xl font-bold text-success">$25.80</div>
        <div className="text-xs text-text-secondary">per Pro monthly ($129)</div>
      </div>
    ),
  },
  {
    title: "Upgrade for the full experience",
    subtitle: "Starter starts at $49/month",
    description: "Free plan gives you 3 ads/month. Starter ($49/mo) gives 100 credits with auto-posting. Pro ($129/mo) unlocks 500 credits, Advanced Mode, AI Write, analytics, and unlimited accounts. Start free, upgrade when ready.",
    icon: Crown,
    color: "from-warning to-primary",
    link: "/settings/billing",
    linkLabel: "See plans & pricing",
    visual: (
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-black/10 p-3">
          <div className="text-xs font-bold uppercase text-text-secondary mb-1">Free</div>
          <div className="font-heading text-lg font-bold text-text-primary">3/mo</div>
          <div className="text-[10px] text-text-secondary">Watermark</div>
        </div>
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-3">
          <div className="text-xs font-bold uppercase text-primary mb-1">Pro</div>
          <div className="font-heading text-lg font-bold text-text-primary">500/mo</div>
          <div className="text-[10px] text-text-secondary">Full power · $129/mo</div>
        </div>
      </div>
    ),
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const Icon = s.icon;
  const isLast = step === STEPS.length - 1;

  function finish() {
    localStorage.setItem("onboarding_done", "1");
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-secondary/30 safe-top">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Logo size="sm" />
        <button
          onClick={finish}
          className="text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary"
        >
          Skip tour
        </button>
      </div>

      {/* Progress bar */}
      <div className="mx-auto w-full max-w-lg px-4 sm:px-6">
        <div className="h-1 rounded-full bg-bg-secondary overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="mt-1.5 text-[10px] sm:text-xs text-text-secondary text-center">
          {step + 1} of {STEPS.length}
        </div>
      </div>

      {/* Slide content — scrollable on mobile */}
      <div className="flex flex-1 items-start sm:items-center justify-center overflow-y-auto px-4 sm:px-6 py-4 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-lg"
          >
            <div className="rounded-2xl sm:rounded-3xl border border-black/5 bg-white p-5 sm:p-8 shadow-xl">
              <div className={`mb-4 sm:mb-5 inline-flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${s.color}`}>
                <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>

              <h1 className="font-heading text-xl sm:text-2xl font-bold text-text-primary">{s.title}</h1>
              <p className="text-xs sm:text-sm font-semibold text-primary mt-1">{s.subtitle}</p>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">{s.description}</p>

              {s.visual}

              {s.link && (
                <Link
                  href={s.link}
                  onClick={() => localStorage.setItem("onboarding_done", "1")}
                  className="mt-4 sm:mt-5 flex h-10 items-center justify-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  {(s as { linkLabel?: string }).linkLabel ?? "Go there"}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav — fixed on mobile so it doesn't scroll away */}
      <div className="sticky bottom-0 bg-bg-secondary/30 backdrop-blur-sm mx-auto w-full max-w-lg px-4 sm:px-6 py-3 sm:py-6 safe-bottom">
        <div className="flex items-center justify-between gap-2">
          {/* Dots — scrollable on mobile if many steps */}
          <div className="flex gap-1 sm:gap-1.5 overflow-x-auto">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 sm:h-2 rounded-full transition-all flex-shrink-0 ${
                  i === step ? "w-6 sm:w-8 bg-primary" : "w-1.5 sm:w-2 bg-bg-secondary hover:bg-black/10"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex h-9 sm:h-11 items-center gap-1 rounded-xl border-2 border-black/10 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-text-primary hover:bg-bg-secondary"
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <button
              onClick={isLast ? finish : () => setStep(step + 1)}
              className="flex h-9 sm:h-11 items-center gap-1 rounded-xl bg-primary px-4 sm:px-6 text-xs sm:text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              {isLast ? "Dashboard" : "Next"}
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
