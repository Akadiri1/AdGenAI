import type { DemoVideo } from "@/components/landing/VideoGallery";

/**
 * Demo videos shown on the landing page.
 *
 * To add real videos:
 *   1. Drop .mp4 files into c:/ads/public/videos/
 *   2. Optionally drop .jpg poster thumbnails into c:/ads/public/videos/posters/
 *   3. Update the entries below with the right filenames
 *
 * For now, the videos point to free Pexels stock clips so the gallery shows
 * something real until you generate your own ads with Seedance / Kling / etc.
 */
export const DEMO_VIDEOS: DemoVideo[] = [
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
