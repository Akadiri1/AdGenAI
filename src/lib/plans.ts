export type PlanKey = "FREE" | "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE";
export type BillingCycle = "monthly" | "yearly";

export const CREDIT_PACK_PRICE_USD = 10; // $10 per pack
export const CREDIT_PACK_AMOUNT = 30;     // 30 seconds of video per pack

// 1 credit = 1 second of finished video output
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
    monthlyCredits: 40,
    maxRollover: 80,
    features: [
      "40 seconds of finished video / month (rolls over to 80)",
      "100+ stock AI actors",
      "Upload your product images",
      "Nano Banana actor + product compositing",
      "Kling 2.6 Pro video generation",
      "AI voiceover + lip-sync (Kokoro TTS + Kling Lip Sync)",
      "Studio: instruction-based scene editing",
      "Buy extra packs ($10 / 30 seconds)",
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
    monthlyCredits: 500,
    maxRollover: 1000,
    features: [
      "500 seconds of finished video / month (rolls over to 1,000)",
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
    monthlyCredits: 1500,
    maxRollover: 3000,
    features: [
      "1,500 seconds of finished video / month (rolls over to 3,000)",
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
    monthlyCredits: 5000,
    maxRollover: 10000,
    features: [
      "5,000 seconds of finished video / month (rolls over to 10,000)",
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
