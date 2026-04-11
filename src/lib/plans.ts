export type PlanKey = "FREE" | "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE";
export type BillingCycle = "monthly" | "yearly";

export const CREDIT_PACK_PRICE_USD = 10; // $10 per credit pack
export const CREDIT_PACK_AMOUNT = 30; // 30 credits per pack (= 10 talking actor ads)

export const PLAN_DEFS: Record<PlanKey, {
  name: string;
  priceMonthlyUsd: number;
  priceYearlyUsd: number;
  monthlyCredits: number;
  maxRollover: number;
  features: string[];
  stripePriceIds: { monthly: string; yearly: string };
}> = {
  FREE: {
    name: "Free",
    priceMonthlyUsd: 0,
    priceYearlyUsd: 0,
    monthlyCredits: 5,
    maxRollover: 5,
    features: [
      "5 credits/month",
      "5 image ads, OR 2 video ads, OR 1 talking actor ad",
      "All platforms supported",
      "Famousli watermark on exports",
      "Free AI tools (Hook Generator, AI Polish)",
      "Community support",
    ],
    stripePriceIds: { monthly: "", yearly: "" },
  },
  STARTER: {
    name: "Starter",
    priceMonthlyUsd: 49,
    priceYearlyUsd: 468,
    monthlyCredits: 150,
    maxRollover: 300,
    features: [
      "150 credits/month (rollover up to 300)",
      "≈ 150 image ads, 75 video ads, or 50 talking actor ads",
      "No watermark",
      "All AI frameworks",
      "Schedule & auto-post",
      "Basic analytics",
      "1 social account per platform",
      "Buy extra credit packs",
      "Email support",
    ],
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "",
      yearly: process.env.STRIPE_PRICE_STARTER_YEARLY ?? "",
    },
  },
  PRO: {
    name: "Pro",
    priceMonthlyUsd: 129,
    priceYearlyUsd: 1236,
    monthlyCredits: 600,
    maxRollover: 1200,
    features: [
      "600 credits/month (rollover up to 1,200)",
      "≈ 600 image ads, 300 video ads, or 200 talking actor ads",
      "Studio editing (full creative control)",
      "AI Write + AI Rewrite on every field",
      "AI voiceover & video assembly",
      "Per-platform analytics + ROI calculator",
      "WhatsApp Business API",
      "Unlimited social accounts",
      "Ad editing after creation",
      "Priority support",
    ],
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? "",
    },
  },
  BUSINESS: {
    name: "Business",
    priceMonthlyUsd: 299,
    priceYearlyUsd: 2868,
    monthlyCredits: 2000,
    maxRollover: 4000,
    features: [
      "2,000 credits/month (rollover up to 4,000)",
      "≈ 2,000 image ads, 1,000 video ads, or 666 talking actor ads",
      "Everything in Pro",
      "API access",
      "Team collaboration (10 seats)",
      "Custom brand kit",
      "White-label exports",
      "Dedicated account manager",
    ],
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? "",
      yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY ?? "",
    },
  },
  ENTERPRISE: {
    name: "Enterprise",
    priceMonthlyUsd: 499,
    priceYearlyUsd: 4788,
    monthlyCredits: 4000,
    maxRollover: 8000,
    features: [
      "4,000 credits/month (rollover up to 8,000)",
      "≈ 4,000 image ads, 2,000 video ads, or 1,333 talking actor ads",
      "Everything in Business",
      "Custom AI model training on your brand",
      "Priority API with higher rate limits",
      "Custom integrations",
      "Unlimited team seats",
      "Dedicated success manager",
      "SLA guarantee",
      "Invoice billing (NET 30)",
    ],
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? "",
      yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY ?? "",
    },
  },
};
