import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { VideoGallery } from "./VideoGallery";
import { DEMO_VIDEOS } from "@/lib/demoVideos";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 sm:px-6 py-16 sm:py-24 md:py-32">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-0 top-40 h-[400px] w-[400px] rounded-full bg-accent/8 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Top badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered ad creation, scheduling, and auto-posting
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-text-primary">
            Create winning ads{" "}
            <span className="gradient-text">with AI</span>
          </h1>
          <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-text-secondary">
            Type your business in one sentence. Get professional video ads, image ads, and copy.
            Auto-post to every platform. No marketing degree needed.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16">
          <Link
            href="/auth/signup"
            className="group flex h-13 sm:h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-primary px-6 sm:px-8 text-base font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-xl"
          >
            <Sparkles className="h-5 w-5" />
            Create Your First Ad Free
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/tools/hook-generator"
            className="flex h-13 sm:h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border-2 border-black/10 bg-white px-6 sm:px-8 text-base font-semibold text-text-primary transition-all hover:border-black/20 hover:bg-bg-secondary"
          >
            Try Free Hook Generator
          </Link>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text-secondary mb-12 sm:mb-16">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-success" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            3 free ads to start
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-success" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            No credit card required
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-success" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            Auto-post to every platform
          </div>
        </div>

        {/* Video gallery — hover to play, click to fullscreen */}
        <div className="mb-2">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Real ads made with Famousli — hover to preview, click to play
            </p>
          </div>
          <VideoGallery videos={DEMO_VIDEOS} />
        </div>

        {/* Platform logos */}
        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-6">
            Create ads for every platform
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 opacity-50">
            {["Instagram", "Facebook", "TikTok", "YouTube", "WhatsApp", "LinkedIn", "X", "Pinterest"].map((p) => (
              <span key={p} className="font-heading text-sm sm:text-base font-bold text-text-primary">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
