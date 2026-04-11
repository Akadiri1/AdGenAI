import type { DemoVideo } from "@/components/landing/VideoGallery";

/**
 * Demo videos shown on the landing page hero gallery.
 *
 * THREE WAYS TO ADD YOUR OWN:
 *
 * 1. Local files (recommended for production):
 *    - Drop .mp4 files into c:/ads/public/videos/
 *    - Drop .jpg poster thumbnails into c:/ads/public/videos/posters/
 *    - Reference like:  src: "/videos/my-ad.mp4", poster: "/videos/posters/my-ad.jpg"
 *
 * 2. Hosted URLs (Cloudflare R2, Vercel Blob, S3, Pexels, etc.):
 *    - Just paste the full URL in src and poster
 *
 * 3. Override via environment variable (useful when you want to swap videos
 *    without redeploying — set NEXT_PUBLIC_DEMO_VIDEOS_JSON to a JSON array):
 *    NEXT_PUBLIC_DEMO_VIDEOS_JSON='[{"id":"d1","title":"...","src":"...","poster":"..."}]'
 *
 * The default list below uses free Pexels stock clips so the gallery is
 * never empty during development. Replace with real Famousli-generated ads
 * before launch (or whenever you have your first sample outputs).
 */

const FALLBACK_VIDEOS: DemoVideo[] = [
  {
    id: "demo-1",
    title: "Skincare UGC",
    tagline: "AI actor reviews a skincare product",
    src: "https://videos.pexels.com/video-files/4068314/4068314-uhd_2160_3840_25fps.mp4",
    poster: "https://images.pexels.com/videos/4068314/free-video-4068314.jpg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "demo-2",
    title: "Coffee Shop Promo",
    tagline: "Storyboard ad for a local cafe",
    src: "https://videos.pexels.com/video-files/3201691/3201691-uhd_2160_3840_25fps.mp4",
    poster: "https://images.pexels.com/videos/3201691/free-video-3201691.jpg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "demo-3",
    title: "Fitness Transformation",
    tagline: "Before & after gym routine ad",
    src: "https://videos.pexels.com/video-files/4754030/4754030-uhd_2160_3840_25fps.mp4",
    poster: "https://images.pexels.com/videos/4754030/free-video-4754030.jpg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "demo-4",
    title: "Fashion Drop",
    tagline: "TikTok-style outfit reveal",
    src: "https://videos.pexels.com/video-files/5876695/5876695-uhd_2160_3840_25fps.mp4",
    poster: "https://images.pexels.com/videos/5876695/free-video-5876695.jpg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "demo-5",
    title: "Tech Product Demo",
    tagline: "30s explainer for a SaaS app",
    src: "https://videos.pexels.com/video-files/3015528/3015528-uhd_2160_3840_25fps.mp4",
    poster: "https://images.pexels.com/videos/3015528/free-video-3015528.jpg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "demo-6",
    title: "Restaurant Ad",
    tagline: "Mouth-watering food close-ups",
    src: "https://videos.pexels.com/video-files/3196284/3196284-uhd_2160_3840_25fps.mp4",
    poster: "https://images.pexels.com/videos/3196284/free-video-3196284.jpg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "demo-7",
    title: "Travel Story",
    tagline: "Wanderlust vibes for booking sites",
    src: "https://videos.pexels.com/video-files/2169307/2169307-uhd_2160_3840_25fps.mp4",
    poster: "https://images.pexels.com/videos/2169307/free-video-2169307.jpg?auto=compress&cs=tinysrgb&w=600",
  },
  {
    id: "demo-8",
    title: "Product Unboxing",
    tagline: "First impressions excitement",
    src: "https://videos.pexels.com/video-files/4630049/4630049-uhd_2160_3840_25fps.mp4",
    poster: "https://images.pexels.com/videos/4630049/free-video-4630049.jpg?auto=compress&cs=tinysrgb&w=600",
  },
];

function parseEnvVideos(): DemoVideo[] | null {
  const raw = process.env.NEXT_PUBLIC_DEMO_VIDEOS_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as DemoVideo[];
  } catch {
    console.warn("[demoVideos] Invalid NEXT_PUBLIC_DEMO_VIDEOS_JSON — using fallback");
  }
  return null;
}

export const DEMO_VIDEOS: DemoVideo[] = parseEnvVideos() ?? FALLBACK_VIDEOS;
