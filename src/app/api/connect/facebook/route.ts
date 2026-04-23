import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canConnectSocialAccount } from "@/lib/socialLimits";
import crypto from "crypto";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const check = await canConnectSocialAccount(session.user.id, "FACEBOOK");
  if (!check.allowed) {
    const url = new URL(req.url);
    return NextResponse.redirect(
      new URL(`/connect?error=${encodeURIComponent(check.reason ?? "Limit reached")}`, url.origin),
    );
  }

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, "");
  const redirectUri = `${baseUrl}/api/connect/facebook/callback`;
  const state = crypto.randomBytes(16).toString("hex") + ":" + session.user.id;

  const fbAppId = process.env.FACEBOOK_APP_ID || process.env.META_APP_ID;
  if (!fbAppId) {
    return NextResponse.redirect(new URL("/connect?error=facebook_not_configured", baseUrl));
  }

  // FB OAuth URL - requires pages_manage_posts and pages_read_engagement for auto-posting
  const params = new URLSearchParams({
    client_id: fbAppId,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    scope: "public_profile,pages_show_list,pages_manage_posts,pages_read_engagement",
  });

  const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?${params.toString()}`;
  
  const res = NextResponse.redirect(authUrl);
  res.cookies.set("fb_oauth_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600 });
  return res;
}
