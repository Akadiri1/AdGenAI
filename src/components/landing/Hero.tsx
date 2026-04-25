import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { TikTokGallery } from "./TikTokGallery";
import { TIKTOK_VIDEOS } from "@/lib/tiktokVideos";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 sm:px-6 py-16 sm:py-24 md:py-32">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[300px] w-[300px] sm:h-[600px] sm:w-[600px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-0 top-40 h-[200px] w-[200px] sm:h-[400px] sm:w-[400px] rounded-full bg-accent/8 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl">
        {/* Top badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            UGC video ads for ecommerce sellers
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-text-primary">
            Real-looking UGC ads{" "}
            <span className="gradient-text">without the actor fees</span>
          </h1>
          <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-text-secondary">
            Pick an AI actor. Upload your product. Get a finished video — voiceover, lip-sync, the works.
            Download the MP4. Post it anywhere.
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
            Free prompts forever
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-success" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            No credit card required
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-success" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            Download as MP4 — post anywhere
          </div>
        </div>

        {/* TikTok gallery — first half of the library (Showcase section shows the rest) */}
        <div className="mb-2">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Real ads from creators worldwide — click any to play
            </p>
          </div>
          <TikTokGallery videos={TIKTOK_VIDEOS.slice(0, Math.floor(TIKTOK_VIDEOS.length / 2))} />
        </div>

        {/* Platform logos — vertical-video formats that fit anywhere */}
        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-6">
            Built for vertical video — works on
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 opacity-50">
            {["Instagram Reels", "TikTok", "YouTube Shorts", "Facebook Reels", "WhatsApp Status", "Snapchat"].map((p) => (
              <span key={p} className="font-heading text-sm sm:text-base font-bold text-text-primary">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
