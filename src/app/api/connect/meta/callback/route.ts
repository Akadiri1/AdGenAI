import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeMetaCode } from "@/lib/social/meta";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");
  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/connect?error=${encodeURIComponent(errorParam)}`, req.url),
    );
  }
  if (!code) {
    return NextResponse.redirect(new URL("/connect?error=missing_code", req.url));
  }

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, "");
  const redirectUri = `${baseUrl}/api/connect/meta/callback`;

  try {
    const { accessToken, expiresIn, igUserId, username } = await exchangeMetaCode(code, redirectUri);
    const tokenExpiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

    await prisma.socialAccount.upsert({
      where: {
        userId_platform_accountId: {
          userId: session.user.id,
          platform: "INSTAGRAM",
          accountId: igUserId,
        },
      },
      update: {
        accessToken,
        accountName: username ?? null,
        isActive: true,
        tokenExpiry,
      },
      create: {
        userId: session.user.id,
        platform: "INSTAGRAM",
        accountId: igUserId,
        accountName: username ?? null,
        accessToken,
        tokenExpiry,
      },
    });

    return NextResponse.redirect(new URL("/connect?success=instagram", req.url));
  } catch (err) {
    return NextResponse.redirect(
      new URL(`/connect?error=${encodeURIComponent((err as Error).message.slice(0, 100))}`, req.url),
    );
  }
}
