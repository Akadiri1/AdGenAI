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
  paystackPlanCodes: { monthly: string; yearly: string };
}> = {
  FREE: {
    name: "Free",
    priceMonthlyUsd: 0,
    priceYearlyUsd: 0,
    monthlyCredits: 0,
    maxRollover: 0,
    features: [
      "Unlimited URL-to-Script generation",
      "3 watermarked exports/month",
      "All AI frameworks (Basic mode)",
      "Community support",
      "Try any AI actor (Preview only)",
    ],
    stripePriceIds: { monthly: "", yearly: "" },
    paystackPlanCodes: { monthly: "", yearly: "" },
  },
  STARTER: {
    name: "Starter",
    priceMonthlyUsd: 15,
    priceYearlyUsd: 144,
    monthlyCredits: 40,
    maxRollover: 80,
    features: [
      "40 credits/month (rollover up to 80)",
      "No watermark",
      "All AI frameworks",
      "Schedule & auto-post",
      "Basic analytics",
      "1 social account per platform",
      "Buy extra credit packs ($10/20 tokens)",
      "Email support",
    ],
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "",
      yearly: process.env.STRIPE_PRICE_STARTER_YEARLY ?? "",
    },
    paystackPlanCodes: {
      monthly: process.env.PAYSTACK_PLAN_STARTER_MONTHLY ?? "",
      yearly: process.env.PAYSTACK_PLAN_STARTER_YEARLY ?? "",
    },
  },
  PRO: {
    name: "Pro",
    priceMonthlyUsd: 129,
    priceYearlyUsd: 1236,
    monthlyCredits: 500,
    maxRollover: 1000,
    features: [
      "500 credits/month (rollover up to 1000)",
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
    paystackPlanCodes: {
      monthly: process.env.PAYSTACK_PLAN_PRO_MONTHLY ?? "",
      yearly: process.env.PAYSTACK_PLAN_PRO_YEARLY ?? "",
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
    paystackPlanCodes: {
      monthly: process.env.PAYSTACK_PLAN_BUSINESS_MONTHLY ?? "",
      yearly: process.env.PAYSTACK_PLAN_BUSINESS_YEARLY ?? "",
    },
  },
  ENTERPRISE: {
    name: "Enterprise",
    priceMonthlyUsd: 499,
    priceYearlyUsd: 4788,
    monthlyCredits: 2000,
    maxRollover: 4000,
    features: [
      "2,000 credits/month (rollover up to 4,000)",
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
    paystackPlanCodes: {
      monthly: process.env.PAYSTACK_PLAN_ENTERPRISE_MONTHLY ?? "",
      yearly: process.env.PAYSTACK_PLAN_ENTERPRISE_YEARLY ?? "",
    },
  },
};
