/**
 * Real TikTok video showcase for the landing page hero gallery.
 *
 * Each entry is a real public TikTok video that demonstrates the kind of
 * AI-generated UGC ad Famousli helps customers create.
 *
 * To add a new TikTok:
 *   1. Copy the TikTok video URL (e.g. https://www.tiktok.com/@username/video/1234567890)
 *   2. Extract the username (after @) and the video ID (after /video/)
 *   3. Add a new entry below
 */

export type TikTokVideo = {
  username: string;        // without @
  videoId: string;         // numeric ID from the URL
  caption: string;         // short label shown in the grid
  category?: string;       // optional badge (e.g. "Skincare", "Fashion")
};

export const TIKTOK_VIDEOS: TikTokVideo[] = [
  {
    username: "wealthylifebylisa",
    videoId: "7625629163524721951",
    caption: "Lifestyle UGC creator showcase",
    category: "Lifestyle",
  },
  {
    username: "mac_marketing_group",
    videoId: "7578779908839656711",
    caption: "AI-driven marketing reel",
    category: "Marketing",
  },
  {
    username: "becauseofmarketing_",
    videoId: "7217778779001818369",
    caption: "Brand storytelling demo",
    category: "Branding",
  },
  {
    username: "haltflow",
    videoId: "7436467958844542241",
    caption: "Performance ad walkthrough",
    category: "Performance",
  },
  {
    username: "emmaugccreator7",
    videoId: "7413351395753086240",
    caption: "UGC creator before & after",
    category: "UGC",
  },
  {
    username: "macagigo",
    videoId: "7571507475455823112",
    caption: "AI ad formula breakdown",
    category: "AI Ads",
  },
  {
    username: "sailawaymedia",
    videoId: "7390763339632184607",
    caption: "Lifestyle brand storytelling",
    category: "Lifestyle",
  },
  {
    username: "hesstimothy",
    videoId: "7614619221359660301",
    caption: "AI-generated talking actor",
    category: "AI Actor",
  },
  {
    username: "its_ai_marketing_uae",
    videoId: "7524389517260754192",
    caption: "AI marketing case study",
    category: "Case Study",
  },
  {
    username: "alaiamoments",
    videoId: "7625610842423201026",
    caption: "Fashion UGC content",
    category: "Fashion",
  },
  {
    username: "yamiflex",
    videoId: "7616190857166720287",
    caption: "Product launch reel",
    category: "Product",
  },
];

/**
 * Build the canonical TikTok URL for a video.
 */
export function tiktokUrl(v: TikTokVideo): string {
  return `https://www.tiktok.com/@${v.username}/video/${v.videoId}`;
}
