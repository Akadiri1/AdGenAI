import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { Providers } from "@/components/Providers";
import { RegisterSW } from "@/components/RegisterSW";
import { CookieConsent } from "@/components/CookieConsent";
import { NativeInit } from "@/components/NativeInit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { LangCode } from "@/lib/i18n";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const viewport = {
  themeColor: "#FF6B35",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://famousli.com"),
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Famousli" },
  title: {
    default: "Famousli — Create Professional Ads in 30 Seconds with AI",
    template: "%s | Famousli",
  },
  description:
    "AI-powered ad creation, scheduling, and auto-posting. Type your business, get video ads, image ads, and copy. Post to Instagram, TikTok, Facebook, WhatsApp automatically. No marketing degree needed.",
  keywords: [
    "AI ad generator",
    "AI ads",
    "ad creator",
    "social media ads",
    "video ad maker",
    "AI ad copy",
    "auto-post ads",
    "UGC ads",
    "AI UGC creator",
    "Instagram ads",
    "TikTok ads",
    "Facebook ads",
    "WhatsApp ads",
    "ad scheduling",
    "AI marketing tool",
    "ad creative automation",
    "performance marketing",
    "small business ads",
    "AI video ads",
    "hook generator",
  ],
  authors: [{ name: "Famousli" }],
  creator: "Famousli",
  publisher: "Famousli",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Famousli — Create Professional Ads in 30 Seconds with AI",
    description:
      "AI-powered ad creation for businesses worldwide. Type your business → get video ads, image ads, and copy → auto-post everywhere. Start free.",
    type: "website",
    locale: "en_US",
    siteName: "Famousli",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Famousli — Create Professional Ads in 30 Seconds with AI",
    description:
      "AI-powered ad creation for small businesses. No marketing degree needed.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve initial language: user's DB preference > cookie > "en"
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("lang")?.value as LangCode | undefined;
  const cookieTheme = cookieStore.get("theme")?.value;
  const isDark = cookieTheme === "dark";
  let initialLang: LangCode = cookieLang ?? "en";
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const u = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { language: true },
      });
      if (u?.language) initialLang = u.language as LangCode;
    }
  } catch {}
  return (
    <html
      lang={initialLang}
      className={`${plusJakartaSans.variable} ${dmSans.variable} ${jetBrainsMono.variable} h-full antialiased${isDark ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers initialLang={initialLang}>{children}</Providers>
        <NativeInit />
        <RegisterSW />
        <CookieConsent />
      </body>
    </html>
  );
}
