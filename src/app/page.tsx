import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { VideoShowcase } from "@/components/landing/VideoShowcase";
import { SocialProof } from "@/components/landing/SocialProof";
import { Features } from "@/components/landing/Features";
import { Results } from "@/components/landing/Results";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

// JSON-LD structured data for Google rich results
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "AdGenAI",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android",
      description:
        "AI-powered ad creation platform. Create professional video ads, image ads, and copy in 30 seconds. Auto-post to Instagram, TikTok, Facebook, WhatsApp, and more.",
      offers: [
        {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          name: "Free",
          description: "3 ads per month, all platforms, watermark",
        },
        {
          "@type": "Offer",
          price: "49",
          priceCurrency: "USD",
          name: "Starter",
          description: "100 credits/month, no watermark, auto-post",
        },
        {
          "@type": "Offer",
          price: "129",
          priceCurrency: "USD",
          name: "Pro",
          description: "500 credits/month, advanced mode, AI UGC, analytics",
        },
        {
          "@type": "Offer",
          price: "299",
          priceCurrency: "USD",
          name: "Business",
          description: "1500 credits/month, API, team collaboration, white-label",
        },
      ],
      featureList: [
        "AI ad copy generation",
        "AI video ad creation",
        "AI UGC creator with avatars",
        "Auto-post to Instagram, Facebook, TikTok, WhatsApp",
        "30+ languages",
        "ROI calculator",
        "Performance scoring",
        "Team collaboration",
        "API access",
        "White-label exports",
      ],
    },
    {
      "@type": "Organization",
      name: "AdGenAI",
      url: "https://adgenai.com",
      description: "AI-powered ad creation for businesses worldwide",
      sameAs: [
        "https://instagram.com/adgenai",
        "https://x.com/adgenai",
        "https://tiktok.com/@adgenai",
        "https://youtube.com/@adgenai",
        "https://linkedin.com/company/adgenai",
      ],
    },
    {
      "@type": "WebSite",
      name: "AdGenAI",
      url: "https://adgenai.com",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://adgenai.com/tools/hook-generator?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Do I need marketing knowledge to use AdGenAI?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Magic Mode is built for people with zero marketing experience. Type your business in one sentence, and AI handles everything.",
          },
        },
        {
          "@type": "Question",
          name: "Which platforms does AdGenAI post to?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Instagram, Facebook, TikTok, YouTube Shorts, X/Twitter, LinkedIn, Pinterest, Snapchat, and WhatsApp.",
          },
        },
        {
          "@type": "Question",
          name: "Is there a free plan?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You get 3 free ads per month. No credit card required.",
          },
        },
        {
          "@type": "Question",
          name: "What languages does AdGenAI support?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "30+ languages including English, Spanish, French, German, Portuguese, Hindi, Arabic, Japanese, Chinese, Swahili, and more.",
          },
        },
      ],
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <VideoShowcase />
        <SocialProof />
        <Features />
        <Results />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
