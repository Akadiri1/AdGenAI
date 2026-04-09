export type Platform =
  | "FACEBOOK"
  | "INSTAGRAM"
  | "TIKTOK"
  | "YOUTUBE"
  | "X_TWITTER"
  | "LINKEDIN"
  | "SNAPCHAT"
  | "WHATSAPP"
  | "PINTEREST"
  | "GOOGLE_ADS";

export type PostMediaInput = {
  caption: string;
  mediaUrl: string; // image or video URL
  mediaType: "image" | "video";
};

export type PostResult = {
  externalPostId: string;
  externalUrl?: string;
};

export interface SocialPoster {
  platform: Platform;
  post(accessToken: string, accountId: string, input: PostMediaInput): Promise<PostResult>;
}
