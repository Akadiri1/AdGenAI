export type PlanKey = "FREE" | "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE";
export type BillingCycle = "monthly" | "yearly";

export const CREDIT_PACK_PRICE_USD = 25; // $25 per credit pack
export const CREDIT_PACK_AMOUNT = 10; // 10 credits per pack

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
    monthlyCredits: 0,
    maxRollover: 0,
    features: [
      "0 monthly credits",
      "1 free credit on signup",
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
    monthlyCredits: 20,
    maxRollover: 40,
    features: [
      "20 credits/month (rollover up to 40)",
      "≈ 20 image ads or 5 talking actor ads",
      "No watermark",
      "All AI frameworks",
      "Schedule & auto-post",
      "Basic analytics",
      "1 social account per platform",
      "Buy extra credit packs ($25/10 tokens)",
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
    monthlyCredits: 80,
    maxRollover: 160,
    features: [
      "80 credits/month (rollover up to 160)",
      "≈ 80 image ads or 20 talking actor ads",
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
    monthlyCredits: 250,
    maxRollover: 500,
    features: [
      "250 credits/month (rollover up to 500)",
      "≈ 250 image ads or 62 talking actor ads",
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
    monthlyCredits: 750,
    maxRollover: 1500,
    features: [
      "750 credits/month (rollover up to 1,500)",
      "≈ 750 image ads or 187 talking actor ads",
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
