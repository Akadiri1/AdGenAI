import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Hook Generator — Create Scroll-Stopping Ad Hooks",
  description:
    "Generate 8 viral ad hooks in seconds with AI. Choose from question, story, pain point, social proof, and urgency styles. Free — no signup required. Powered by Famousli.",
  keywords: [
    "hook generator",
    "ad hook generator",
    "AI hook generator",
    "scroll-stopping hooks",
    "ad hooks",
    "TikTok hooks",
    "Instagram hooks",
    "Facebook ad hooks",
    "viral hooks",
    "ad copy generator",
    "free AI tool",
  ],
  openGraph: {
    title: "Free AI Hook Generator — Scroll-Stopping Ad Hooks in Seconds",
    description: "Generate 8 viral ad hooks instantly. Question, story, pain point, social proof styles. Free, no signup. Powered by Famousli.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Hook Generator",
    description: "Generate scroll-stopping ad hooks in seconds. Free tool by Famousli.",
  },
  alternates: {
    canonical: "/tools/hook-generator",
  },
};

export default function HookGeneratorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
