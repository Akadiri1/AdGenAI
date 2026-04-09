import type { SocialPoster, PostMediaInput, PostResult } from "./types";

// === Instagram Business Login API (modern, 2024+) ===
// Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
//
// Auth flow:
// 1. Redirect user to https://www.instagram.com/oauth/authorize
// 2. Exchange code for a short-lived token at https://api.instagram.com/oauth/access_token
// 3. Exchange short-lived for long-lived (60 days) at https://graph.instagram.com/access_token
// 4. Post to https://graph.instagram.com/v23.0/{ig-user-id}/media then /media_publish

const IG_API = "https://graph.instagram.com/v23.0";

// Instagram Business poster — publishes photo or video to an IG Business account
export const instagramPoster: SocialPoster = {
  platform: "INSTAGRAM",
  async post(accessToken: string, igUserId: string, input: PostMediaInput): Promise<PostResult> {
    // Step 1: Create media container
    const createParams = new URLSearchParams({
      access_token: accessToken,
      caption: input.caption.slice(0, 2200), // IG caption limit
    });

    if (input.mediaType === "video") {
      createParams.set("media_type", "REELS");
      createParams.set("video_url", input.mediaUrl);
    } else {
      createParams.set("image_url", input.mediaUrl);
    }

    const containerRes = await fetch(`${IG_API}/${igUserId}/media?${createParams.toString()}`, {
      method: "POST",
    });
    if (!containerRes.ok) {
      throw new Error(`IG container failed: ${await containerRes.text()}`);
    }
    const { id: creationId } = await containerRes.json();

    // Step 2 (video only): poll until status_code = FINISHED
    if (input.mediaType === "video") {
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const statusRes = await fetch(
          `${IG_API}/${creationId}?fields=status_code&access_token=${accessToken}`,
        );
        const { status_code } = await statusRes.json();
        if (status_code === "FINISHED") break;
        if (status_code === "ERROR") throw new Error("IG video processing failed");
      }
    }

    // Step 3: Publish the container
    const publishRes = await fetch(
      `${IG_API}/${igUserId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`,
      { method: "POST" },
    );
    if (!publishRes.ok) {
      throw new Error(`IG publish failed: ${await publishRes.text()}`);
    }
    const { id: mediaId } = await publishRes.json();

    // Step 4: Fetch the permalink
    let permalink: string | undefined;
    try {
      const permRes = await fetch(
        `${IG_API}/${mediaId}?fields=permalink&access_token=${accessToken}`,
      );
      const permData = await permRes.json();
      permalink = permData.permalink;
    } catch { /* best-effort */ }

    return { externalPostId: mediaId, externalUrl: permalink };
  },
};

// Facebook Page posting (kept for future use once Content management use case is added)
export const facebookPoster: SocialPoster = {
  platform: "FACEBOOK",
  async post(): Promise<PostResult> {
    throw new Error("Facebook Page posting requires the Content management use case. Enable it in your Meta app.");
  },
};

// === OAuth helpers (Instagram Business Login) ===
export const META_AUTH_URL = (redirectUri: string, state: string) => {
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID ?? process.env.META_APP_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "instagram_business_basic,instagram_business_content_publish",
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
};

export async function exchangeMetaCode(
  code: string,
  redirectUri: string,
): Promise<{
  accessToken: string;
  expiresIn: number;
  igUserId: string;
  username?: string;
}> {
  // Step 1: short-lived token
  const form = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID ?? process.env.META_APP_ID ?? "",
    client_secret: process.env.INSTAGRAM_APP_SECRET ?? process.env.META_APP_SECRET ?? "",
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });
  const shortRes = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!shortRes.ok) throw new Error(`IG token exchange failed: ${await shortRes.text()}`);
  const shortData = await shortRes.json();
  const shortToken = shortData.access_token as string;
  const igUserId = String(shortData.user_id);

  // Step 2: exchange for long-lived token (60 days, refreshable)
  const longRes = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET ?? process.env.META_APP_SECRET}&access_token=${shortToken}`,
  );
  if (!longRes.ok) throw new Error(`IG long-lived token failed: ${await longRes.text()}`);
  const longData = await longRes.json();

  // Step 3: fetch username
  let username: string | undefined;
  try {
    const meRes = await fetch(`${IG_API}/me?fields=username&access_token=${longData.access_token}`);
    const me = await meRes.json();
    username = me.username;
  } catch { /* best-effort */ }

  return {
    accessToken: longData.access_token,
    expiresIn: longData.expires_in ?? 60 * 24 * 3600,
    igUserId,
    username,
  };
}
