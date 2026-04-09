import type { SocialPoster, PostMediaInput, PostResult } from "./types";

// X/Twitter v2 tweet creation with media
export const twitterPoster: SocialPoster = {
  platform: "X_TWITTER",
  async post(accessToken: string, _accountId: string, input: PostMediaInput): Promise<PostResult> {
    // Step 1: download media and upload to Twitter
    const mediaRes = await fetch(input.mediaUrl);
    const mediaBuf = await mediaRes.arrayBuffer();
    const b64 = Buffer.from(mediaBuf).toString("base64");

    const uploadRes = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ media_data: b64 }),
    });
    if (!uploadRes.ok) throw new Error(`Twitter upload failed: ${await uploadRes.text()}`);
    const uploadData = await uploadRes.json();
    const mediaId = uploadData.media_id_string;

    // Step 2: post tweet
    const tweetRes = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: input.caption.slice(0, 280),
        media: { media_ids: [mediaId] },
      }),
    });
    if (!tweetRes.ok) throw new Error(`Twitter post failed: ${await tweetRes.text()}`);
    const tweetData = await tweetRes.json();
    return {
      externalPostId: tweetData.data.id,
      externalUrl: `https://twitter.com/i/web/status/${tweetData.data.id}`,
    };
  },
};

export const TWITTER_AUTH_URL = (redirectUri: string, state: string, codeChallenge: string) => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TWITTER_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    scope: "tweet.read tweet.write users.read media.write offline.access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
};
