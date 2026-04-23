import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.redirect(new URL("/auth/login", req.url));

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/connect?error=no_code", req.url));

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || url.origin).replace(/\/$/, "");
  const redirectUri = `${baseUrl}/api/connect/facebook/callback`;

  const appId = process.env.FACEBOOK_APP_ID || process.env.META_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET || process.env.META_APP_SECRET;

  try {
    // 1. Exchange code for user access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error?.message || "Token exchange failed");

    const userToken = tokenData.access_token;

    // 2. Get list of pages managed by the user
    const pagesRes = await fetch(
      `https://graph.facebook.com/v23.0/me/accounts?access_token=${userToken}`
    );
    const pagesData = await pagesRes.json();
    if (!pagesRes.ok) throw new Error("Failed to fetch pages");

    const pages = pagesData.data || [];
    if (pages.length === 0) throw new Error("No Facebook Pages found for this account");

    // For now, we take the first page. In a full product, you might show a selector.
    const page = pages[0];

    // 3. Save the Page Access Token to DB
    await prisma.socialAccount.upsert({
      where: {
        userId_platform_accountId: {
          userId: session.user.id,
          platform: "FACEBOOK",
          accountId: page.id,
        },
      },
      update: {
        accessToken: page.access_token,
        accountName: page.name,
        isActive: true,
      },
      create: {
        userId: session.user.id,
        platform: "FACEBOOK",
        accountId: page.id,
        accountName: page.name,
        accessToken: page.access_token,
      },
    });

    return NextResponse.redirect(new URL("/connect?success=facebook", baseUrl));
  } catch (err) {
    console.error("Facebook callback error:", err);
    return NextResponse.redirect(
      new URL(`/connect?error=${encodeURIComponent((err as Error).message)}`, baseUrl)
    );
  }
}
