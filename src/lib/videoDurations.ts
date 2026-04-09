/**
 * Video duration presets aligned with platform ad requirements.
 */

export type VideoDuration = {
  id: string;
  label: string;
  seconds: number;
  imagesNeeded: number; // how many images to fill the duration
  durationPerImage: number; // seconds each image shows
  platforms: string[];
  description: string;
};

export const VIDEO_DURATIONS: VideoDuration[] = [
  {
    id: "6s",
    label: "6 seconds",
    seconds: 6,
    imagesNeeded: 2,
    durationPerImage: 3,
    platforms: ["YouTube Bumper", "Instagram Story"],
    description: "Ultra-short bumper ad — hook + CTA only",
  },
  {
    id: "15s",
    label: "15 seconds",
    seconds: 15,
    imagesNeeded: 3,
    durationPerImage: 5,
    platforms: ["TikTok", "Reels", "YouTube Shorts", "Snapchat"],
    description: "Standard short-form — hook, benefit, CTA",
  },
  {
    id: "30s",
    label: "30 seconds",
    seconds: 30,
    imagesNeeded: 5,
    durationPerImage: 6,
    platforms: ["TikTok", "Reels", "YouTube Shorts", "Facebook Feed"],
    description: "Full short-form — hook, problem, solution, proof, CTA",
  },
  {
    id: "60s",
    label: "60 seconds",
    seconds: 60,
    imagesNeeded: 8,
    durationPerImage: 7,
    platforms: ["TikTok", "Reels", "YouTube", "Facebook", "LinkedIn"],
    description: "Extended format — full story arc with multiple scenes",
  },
];

export function getDuration(id: string): VideoDuration {
  return VIDEO_DURATIONS.find((d) => d.id === id) ?? VIDEO_DURATIONS[1]; // default 15s
}
