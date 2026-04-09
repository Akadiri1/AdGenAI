import type { SocialPoster, PostMediaInput, PostResult } from "./types";

// TikTok Content Posting API — video only
export const tiktokPoster: SocialPoster = {
  platform: "TIKTOK",
  async post(accessToken: string, _accountId: string, input: PostMediaInput): Promise<PostResult> {
    if (input.mediaType !== "video") {
      throw new Error("TikTok only supports video posts");
    }

    // Step 1: init upload from URL
    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: input.caption.slice(0, 150),
          privacy_level: "SELF_ONLY", // sandbox requires this until app is approved
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: input.mediaUrl,
        },
      }),
    });
    if (!initRes.ok) throw new Error(`TikTok init failed: ${await initRes.text()}`);
    const initData = await initRes.json();
    const publishId = initData.data?.publish_id;
    if (!publishId) throw new Error("No publish_id returned");

    return { externalPostId: publishId };
  },
};

export const TIKTOK_AUTH_URL = (redirectUri: string, state: string) => {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY ?? "",
    response_type: "code",
    scope: "user.info.basic,video.publish,video.upload",
    redirect_uri: redirectUri,
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
};

export async function exchangeTikTokCode(code: string, redirectUri: string) {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY ?? "",
      client_secret: process.env.TIKTOK_CLIENT_SECRET ?? "",
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`TikTok token exchange failed: ${await res.text()}`);
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    openId: data.open_id,
    expiresIn: data.expires_in,
  };
}
