export type PlanKey = "FREE" | "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE";
export type BillingCycle = "monthly" | "yearly";

export const CREDIT_PACK_PRICE_USD = 10; // $10 per credit pack
export const CREDIT_PACK_AMOUNT = 20; // 20 credits per pack

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
    monthlyCredits: 3,
    maxRollover: 3,
    features: [
      "3 ads per month",
      "All platforms supported",
      "Watermark on exports",
      "Basic templates",
      "Community support",
    ],
    stripePriceIds: { monthly: "", yearly: "" },
  },
  STARTER: {
    name: "Starter",
    priceMonthlyUsd: 49,
    priceYearlyUsd: 468,
    monthlyCredits: 100,
    maxRollover: 200,
    features: [
      "100 credits/month (rollover up to 200)",
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
    monthlyCredits: 500,
    maxRollover: 1000,
    features: [
      "500 credits/month (rollover up to 1,000)",
      "Advanced Mode (full creative control)",
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
    monthlyCredits: 1500,
    maxRollover: 3000,
    features: [
      "1,500 credits/month (rollover up to 3,000)",
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
    monthlyCredits: 2000,
    maxRollover: 5000,
    features: [
      "2,000 credits/month (rollover up to 5,000)",
      "Advanced Mode (full creative control)",
      "AI Write + AI Rewrite on every field",
      "AI voiceover & video assembly",
      "Per-platform analytics + ROI calculator",
      "WhatsApp Business API",
      "Unlimited social accounts",
      "Ad editing after creation",
      "API access",
      "Custom brand kit",
      "White-label exports",
      "Unlimited team seats",
      "Custom AI model training on your brand",
      "Priority API with higher rate limits",
      "Custom integrations",
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
