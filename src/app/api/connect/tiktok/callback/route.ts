import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeTikTokCode } from "@/lib/social/tiktok";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.redirect(new URL("/auth/login", req.url));

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/connect?error=invalid", req.url));

  const redirectUri = `${url.origin}/api/connect/tiktok/callback`;
  const { accessToken, refreshToken, openId, expiresIn } = await exchangeTikTokCode(code, redirectUri);

  await prisma.socialAccount.upsert({
    where: {
      userId_platform_accountId: {
        userId: session.user.id,
        platform: "TIKTOK",
        accountId: openId,
      },
    },
    update: {
      accessToken,
      refreshToken,
      tokenExpiry: new Date(Date.now() + expiresIn * 1000),
      isActive: true,
    },
    create: {
      userId: session.user.id,
      platform: "TIKTOK",
      accountId: openId,
      accessToken,
      refreshToken,
      tokenExpiry: new Date(Date.now() + expiresIn * 1000),
    },
  });

  return NextResponse.redirect(new URL("/connect?success=tiktok", req.url));
}
