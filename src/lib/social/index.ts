import type { Platform, SocialPoster } from "./types";
import { facebookPoster, instagramPoster } from "./meta";
import { tiktokPoster } from "./tiktok";
import { twitterPoster } from "./twitter";

const POSTERS: Partial<Record<Platform, SocialPoster>> = {
  FACEBOOK: facebookPoster,
  INSTAGRAM: instagramPoster,
  TIKTOK: tiktokPoster,
  X_TWITTER: twitterPoster,
};

export function getPoster(platform: Platform): SocialPoster | null {
  return POSTERS[platform] ?? null;
}

export * from "./types";
