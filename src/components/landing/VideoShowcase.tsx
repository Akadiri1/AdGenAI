import { TikTokGallery } from "./TikTokGallery";
import { TIKTOK_VIDEOS } from "@/lib/tiktokVideos";

export function VideoShowcase() {
  // Show the second half of the TikTok library here so the Hero and Showcase
  // sections display different videos (no duplication on the landing page).
  const secondHalf = TIKTOK_VIDEOS.slice(Math.floor(TIKTOK_VIDEOS.length / 2));

  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-10 sm:mb-16">
          <div className="inline-block rounded-full bg-secondary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-secondary mb-4">
            Video Showcase
          </div>
          <h2 className="font-heading text-3xl font-bold text-text-primary md:text-5xl">
            Every ad format, one platform
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-secondary">
            Generate UGC-style testimonials, product demos, transformation ads, and vertical story
            ads — all powered by AI. Tap any video to watch a real example from creators worldwide.
          </p>
        </div>

        <TikTokGallery videos={secondHalf} />
      </div>
    </section>
  );
}
