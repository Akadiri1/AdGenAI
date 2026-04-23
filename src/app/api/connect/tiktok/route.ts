import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TIKTOK_AUTH_URL } from "@/lib/social/tiktok";
import crypto from "crypto";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const redirectUri = `${baseUrl}/api/connect/tiktok/callback`;
  const state = crypto.randomBytes(16).toString("hex") + ":" + session.user.id;

  const res = NextResponse.redirect(TIKTOK_AUTH_URL(redirectUri, state));
  res.cookies.set("tiktok_oauth_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600 });
  return res;
}
