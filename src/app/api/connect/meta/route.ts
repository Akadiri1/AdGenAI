import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { META_AUTH_URL } from "@/lib/social/meta";
import { canConnectSocialAccount } from "@/lib/socialLimits";
import crypto from "crypto";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const check = await canConnectSocialAccount(session.user.id, "INSTAGRAM");
  if (!check.allowed) {
    return NextResponse.redirect(
      new URL(`/connect?error=${encodeURIComponent(check.reason ?? "Limit reached")}`, req.url),
    );
  }

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).trim().replace(/\/$/, "");
  const redirectUri = `${baseUrl}/api/connect/meta/callback`;
  
  console.log("[MetaOAuth] Sending redirect_uri:", redirectUri);

  const state = crypto.randomBytes(16).toString("hex") + ":" + session.user.id;

  const res = NextResponse.redirect(META_AUTH_URL(redirectUri, state));
  res.cookies.set("meta_oauth_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600 });
  return res;
}
