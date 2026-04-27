export type PlanKey = "FREE" | "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE";
export type BillingCycle = "monthly" | "yearly";

export const CREDIT_PACK_PRICE_USD = 10; // $10 per pack
export const CREDIT_PACK_AMOUNT = 100;    // 100 credits per pack (~2 fifteen-second ads)

// 1 credit = 1 second of video + compositing overhead
// Credits do NOT roll over — they expire at the end of each billing month.
export const PLAN_DEFS: Record<PlanKey, {
  name: string;
  tagline: string;
  priceMonthlyUsd: number;
  priceYearlyUsd: number;
  monthlyCredits: number;
  maxRollover: number;
  features: string[];
  notIncluded?: string[];
  stripePriceIds: { monthly: string; yearly: string };
  paystackPlanCodes: { monthly: string; yearly: string };
}> = {
  FREE: {
    name: "Free",
    tagline: "Try the AI — get prompts to use anywhere",
    priceMonthlyUsd: 0,
    priceYearlyUsd: 0,
    monthlyCredits: 0,
    maxRollover: 0,
    features: [
      "Unlimited AI script + scene-prompt generation",
      "Copy prompts into Kling, Veo, Sora — any AI video tool",
      "Browse 100+ stock AI actors",
      "Brand kit (business voice, audience, tone)",
    ],
    notIncluded: [
      "No video generation on Famousli",
      "No actor + product compositing",
      "No exported ads",
    ],
    stripePriceIds: { monthly: "", yearly: "" },
    paystackPlanCodes: { monthly: "", yearly: "" },
  },
  STARTER: {
    name: "Starter",
    tagline: "First real video ads — for solo sellers",
    priceMonthlyUsd: 15,
    priceYearlyUsd: 144,
    monthlyCredits: 300,
    maxRollover: 0,
    features: [
      "300 credits / month — ~8 fifteen-second ads (no rollover)",
      "100+ stock AI actors",
      "Upload your product images",
      "Nano Banana actor + product compositing",
      "Kling 2.6 Pro video generation",
      "AI voiceover + lip-sync",
      "Studio: instruction-based scene editing",
      "Buy extra packs ($10 / 100 credits)",
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
    tagline: "Volume + control — for growing brands",
    priceMonthlyUsd: 129,
    priceYearlyUsd: 1236,
    monthlyCredits: 2000,
    maxRollover: 0,
    features: [
      "2,000 credits / month — ~57 fifteen-second ads (no rollover)",
      "Everything in Starter",
      "Upload your own custom actors (your face, your team)",
      "Multi-scene cinematic ads (up to 60s)",
      "Email support",
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
    tagline: "For agencies & high-volume sellers",
    priceMonthlyUsd: 349,
    priceYearlyUsd: 3348,
    monthlyCredits: 5000,
    maxRollover: 0,
    features: [
      "5,000 credits / month — ~142 fifteen-second ads (no rollover)",
      "Everything in Pro",
      "Priority email support",
      "Discounted top-up packs",
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
    tagline: "Custom-built for scale",
    priceMonthlyUsd: 999,
    priceYearlyUsd: 9588,
    monthlyCredits: 15000,
    maxRollover: 0,
    features: [
      "15,000 credits / month — ~428 fifteen-second ads (no rollover)",
      "Everything in Business",
      "Direct line to founders for feature requests",
      "Custom invoicing (NET 30)",
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

export function canGenerateVideo(plan: PlanKey): boolean {
  return ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"].includes(plan);
}

export function canUploadCustomActor(plan: PlanKey): boolean {
  return ["PRO", "BUSINESS", "ENTERPRISE"].includes(plan);
}

export function canUseAPI(plan: PlanKey): boolean {
  return ["BUSINESS", "ENTERPRISE"].includes(plan);
}

export function canUseTeam(plan: PlanKey): boolean {
  return ["BUSINESS", "ENTERPRISE"].includes(plan);
}

export function canWhiteLabel(plan: PlanKey): boolean {
  return ["BUSINESS", "ENTERPRISE"].includes(plan);
}
