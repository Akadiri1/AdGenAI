import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TIKTOK_AUTH_URL } from "@/lib/social/tiktok";
import { canConnectSocialAccount } from "@/lib/socialLimits";
import crypto from "crypto";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const check = await canConnectSocialAccount(session.user.id, "TIKTOK");
  if (!check.allowed) {
    const url = new URL(req.url);
    return NextResponse.redirect(
      new URL(`/connect?error=${encodeURIComponent(check.reason ?? "Limit reached")}`, url.origin),
    );
  }

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, "");
  const redirectUri = `${baseUrl}/api/connect/tiktok/callback`;
  const state = crypto.randomBytes(16).toString("hex") + ":" + session.user.id;

  const res = NextResponse.redirect(TIKTOK_AUTH_URL(redirectUri, state));
  res.cookies.set("tiktok_oauth_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600 });
  return res;
}
