"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Check, ArrowRight, Loader2, Zap } from "lucide-react";
import { Logo } from "@/components/Logo";

const HOOK_STYLES = [
  { id: "question", label: "Question", example: "Did you know 80% of ads fail in the first 3 seconds?" },
  { id: "controversial", label: "Hot Take", example: "Unpopular opinion: you don't need a marketing degree to run ads" },
  { id: "story", label: "Story", example: "I was spending $500/month on ads with zero results. Then..." },
  { id: "statistic", label: "Stat/Fact", example: "73% of consumers decide within 3 seconds whether to watch an ad" },
  { id: "pain", label: "Pain Point", example: "Tired of paying thousands for ads that don't convert?" },
  { id: "curiosity", label: "Curiosity Gap", example: "The one thing top brands do differently with their ads..." },
  { id: "social-proof", label: "Social Proof", example: "10,000+ businesses switched to AI ads this month" },
  { id: "urgency", label: "Urgency", example: "Your competitors are already using AI to create ads. Are you?" },
];

export default function HookGeneratorPage() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["question", "pain", "curiosity"]);
  const [hooks, setHooks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);

  async function generate() {
    if (!product.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tools/hook-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          audience,
          styles: selectedStyles,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setHooks(data.hooks);
      setGenerateCount((c) => c + 1);
      // Show signup prompt after 2 generations
      if (generateCount >= 1) setShowSignup(true);
    } catch {
      setHooks(["Something went wrong. Try again."]);
    } finally {
      setLoading(false);
    }
  }

  function copyHook(index: number) {
    navigator.clipboard.writeText(hooks[index]);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  }

  function toggleStyle(id: string) {
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-secondary/30 to-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-5xl mx-auto">
        <Link href="/"><Logo size="md" /></Link>
        <Link
          href="/auth/signup"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          Create full ads free
        </Link>
      </nav>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-16">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
            <Zap className="h-3.5 w-3.5" /> Free tool — no signup required
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-text-primary leading-tight">
            AI Hook Generator
          </h1>
          <p className="mt-3 text-lg text-text-secondary max-w-xl mx-auto">
            Generate scroll-stopping hooks for your ads in seconds. The hook is the first 3 seconds — it decides if people watch or scroll past.
          </p>
        </div>

        {/* Input */}
        <div className="rounded-3xl border border-black/5 bg-white p-6 sm:p-8 shadow-xl mb-8">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                What are you advertising?
              </label>
              <input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="e.g. AI-powered ad creation platform, handmade candles, fitness app..."
                className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Target audience <span className="font-normal text-text-secondary">(optional)</span>
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. small business owners, fitness enthusiasts, Gen Z shoppers..."
                className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Hook styles
              </label>
              <div className="flex flex-wrap gap-2">
                {HOOK_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleStyle(s.id)}
                    className={`rounded-xl border-2 px-3 py-1.5 text-xs font-semibold transition-all ${
                      selectedStyles.includes(s.id)
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-black/10 text-text-secondary hover:border-black/20"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generate}
              disabled={loading || !product.trim()}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:bg-primary-dark disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Generating hooks..." : "Generate hooks"}
            </button>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {hooks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 mb-8"
            >
              <h2 className="font-heading text-xl font-bold text-text-primary">
                Your hooks ({hooks.length})
              </h2>
              {hooks.map((hook, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <p className="flex-1 text-text-primary leading-relaxed">{hook}</p>
                  <button
                    onClick={() => copyHook(i)}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-bg-secondary text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {copied === i ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Signup CTA */}
        {(showSignup || hooks.length > 0) && (
          <div className="rounded-3xl gradient-bg animate-gradient p-8 text-white text-center">
            <h3 className="font-heading text-2xl font-bold mb-2">
              Love these hooks? Create full ads with them.
            </h3>
            <p className="text-white/90 mb-6 max-w-md mx-auto">
              Famousli turns your hook into a complete ad — copy, images, video, music — and auto-posts to Instagram, TikTok, Facebook, and more.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-6 text-base font-bold text-primary shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all"
            >
              Start creating ads free <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        )}

        {/* Examples section */}
        {hooks.length === 0 && (
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h3 className="font-heading font-bold text-text-primary mb-4">Example hooks by style</h3>
            <div className="space-y-3">
              {HOOK_STYLES.map((s) => (
                <div key={s.id} className="flex items-start gap-3">
                  <span className="rounded-lg bg-bg-secondary px-2 py-0.5 text-[10px] font-semibold text-text-secondary flex-shrink-0 mt-1">
                    {s.label}
                  </span>
                  <p className="text-sm text-text-primary italic">&ldquo;{s.example}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
