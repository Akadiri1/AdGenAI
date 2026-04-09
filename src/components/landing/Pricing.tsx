"use client";

import { useState } from "react";
import Link from "next/link";

const currencies = {
  USD: { symbol: "$", rate: 1, label: "USD" },
  EUR: { symbol: "€", rate: 0.92, label: "EUR" },
  GBP: { symbol: "£", rate: 0.78, label: "GBP" },
  NGN: { symbol: "₦", rate: 1500, label: "NGN" },
  INR: { symbol: "₹", rate: 83, label: "INR" },
  BRL: { symbol: "R$", rate: 5, label: "BRL" },
};

type BillingCycle = "monthly" | "yearly";

const plans = [
  {
    name: "Free",
    priceMonthlyUsd: 0,
    priceYearlyUsd: 0,
    description: "Try before you buy",
    credits: "3 ads/month",
    features: [
      "3 ads per month",
      "All platforms supported",
      "Watermark on exports",
      "Basic templates",
      "Community support",
    ],
    cta: "Start free",
    popular: false,
  },
  {
    name: "Starter",
    priceMonthlyUsd: 49,
    priceYearlyUsd: 468,
    description: "For solopreneurs",
    credits: "100 credits/month",
    features: [
      "100 credits/month (rollover)",
      "No watermark",
      "All AI frameworks",
      "Schedule & auto-post",
      "Basic analytics",
      "Email support",
    ],
    cta: "Get Starter",
    popular: false,
  },
  {
    name: "Pro",
    priceMonthlyUsd: 129,
    priceYearlyUsd: 1236,
    description: "For growing brands",
    credits: "500 credits/month",
    features: [
      "500 credits/month (rollover)",
      "Advanced Mode (full creative control)",
      "AI Write + AI Rewrite",
      "Video assembly with music",
      "Per-platform analytics + ROI",
      "WhatsApp Business API",
      "Unlimited social accounts",
      "Ad editing after creation",
      "Priority support",
    ],
    cta: "Get Pro",
    popular: true,
  },
  {
    name: "Business",
    priceMonthlyUsd: 299,
    priceYearlyUsd: 2868,
    description: "For agencies & teams",
    credits: "1,500 credits/month",
    features: [
      "1,500 credits/month (rollover)",
      "Everything in Pro",
      "API access",
      "Team collaboration (10 seats)",
      "Custom brand kit",
      "White-label exports",
      "Dedicated account manager",
    ],
    cta: "Get Business",
    popular: false,
  },
  {
    name: "Enterprise",
    priceMonthlyUsd: 499,
    priceYearlyUsd: 4788,
    description: "For agencies & large brands",
    credits: "2,000 credits/month",
    features: [
      "2,000 credits/month (rollover)",
      "Everything in Business",
      "Unlimited team seats",
      "Custom AI model training",
      "Priority API access",
      "Custom integrations",
      "SLA guarantee",
      "Invoice billing (NET 30)",
    ],
    cta: "Contact sales",
    popular: false,
  },
];

export function Pricing() {
  const [currency, setCurrency] = useState<keyof typeof currencies>("USD");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  const formatPrice = (usd: number) => {
    const c = currencies[currency];
    const amount = usd * c.rate;
    if (amount === 0) return "0";
    return Math.round(amount).toLocaleString();
  };

  return (
    <section id="pricing" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-4">
            Pricing
          </div>
          <h2 className="font-heading text-3xl font-bold text-text-primary md:text-5xl">
            Start with the plan that fits your needs
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            You can upgrade anytime. Credits roll over. Cancel whenever.
          </p>

          <div className="mt-8 inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white p-1">
            <button
              onClick={() => setCycle("monthly")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                cycle === "monthly" ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                cycle === "yearly" ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Annual
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                cycle === "yearly" ? "bg-white text-primary" : "bg-success/20 text-success"
              }`}>
                Save 20%
              </span>
            </button>
          </div>

          <div className="mt-4 inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white p-1">
            {(Object.keys(currencies) as Array<keyof typeof currencies>).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  currency === c
                    ? "bg-text-primary text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {currencies[c].label}
              </button>
            ))}
          </div>
        </div>

        {/* Free plan — landscape bar */}
        <div className="max-w-5xl mx-auto mb-8 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div>
                <span className="font-heading text-lg font-bold text-text-primary">Free</span>
                <span className="font-heading text-lg font-bold text-text-primary ml-2">$0</span>
              </div>
              <div className="hidden sm:block h-6 w-px bg-black/10" />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
                <span>3 ads/month</span>
                <span>All platforms</span>
                <span>Watermark</span>
                <span>No credit card</span>
              </div>
            </div>
            <Link href="/auth/signup" className="flex-shrink-0 rounded-xl bg-bg-secondary px-5 py-2 text-sm font-semibold text-text-primary hover:bg-black/5 transition-colors">
              Start free
            </Link>
          </div>
        </div>

        {/* Main 3 plans */}
        <div className="grid gap-4 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.filter((p) => ["Starter", "Pro", "Business"].includes(p.name)).map((plan) => {
            const price = cycle === "monthly" ? plan.priceMonthlyUsd : plan.priceYearlyUsd / 12;
            const totalYearly = plan.priceYearlyUsd;

            return (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-8 transition-all ${
                  plan.popular
                    ? "border-2 border-primary bg-white shadow-2xl shadow-primary/20 md:scale-105"
                    : "border border-black/5 bg-white shadow-sm hover:shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                    Most popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-heading text-2xl font-bold text-text-primary mb-1">{plan.name}</h3>
                  <p className="text-sm text-text-secondary">{plan.description}</p>
                </div>

                <div className="mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-text-secondary">
                      {currencies[currency].symbol}
                    </span>
                    <span className="font-heading text-5xl font-extrabold text-text-primary">
                      {formatPrice(price)}
                    </span>
                    <span className="text-text-secondary">/mo</span>
                  </div>
                  {cycle === "yearly" && plan.priceMonthlyUsd > 0 && (
                    <div className="mt-1 text-xs text-text-secondary">
                      Billed {currencies[currency].symbol}{formatPrice(totalYearly)}/year
                    </div>
                  )}
                  {cycle === "monthly" && plan.priceMonthlyUsd > 0 && (
                    <div className="mt-1 text-xs text-text-secondary">Billed monthly</div>
                  )}
                </div>

                <div className="mb-6 rounded-lg bg-bg-secondary px-3 py-2 text-xs font-semibold text-text-primary">
                  {plan.credits}
                </div>

                <Link
                  href="/auth/signup"
                  className={`mb-6 flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                    plan.popular
                      ? "bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg"
                      : "bg-bg-secondary text-text-primary hover:bg-black/5"
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
                      <svg className="h-5 w-5 flex-shrink-0 text-success" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Enterprise — landscape bar matching Free style */}
        {(() => {
          const ep = plans.find((p) => p.name === "Enterprise");
          if (!ep) return null;
          const price = cycle === "monthly" ? ep.priceMonthlyUsd : ep.priceYearlyUsd / 12;
          return (
            <div className="max-w-5xl mx-auto mt-8 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading text-lg font-bold text-text-primary">{ep.name}</span>
                    <span className="ml-2 text-sm text-text-secondary">{currencies[currency].symbol}</span>
                    <span className="font-heading text-lg font-extrabold text-text-primary">{formatPrice(price)}</span>
                    <span className="text-xs text-text-secondary">/mo</span>
                  </div>
                  <div className="hidden sm:block h-6 w-px bg-black/10" />
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                    <span>{ep.credits}</span>
                    <span>Unlimited seats</span>
                    <span>Custom AI</span>
                    <span>SLA</span>
                    <span>API</span>
                  </div>
                </div>
                <a
                  href="mailto:sales@adgenai.com?subject=Enterprise%20Plan"
                  className="flex-shrink-0 flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-secondary to-primary px-5 text-sm font-semibold text-white hover:shadow-lg transition-all"
                >
                  Contact sales
                </a>
              </div>
            </div>
          );
        })()}

        <p className="mt-8 text-center text-sm text-text-secondary">
          Need more credits? Buy packs of 20 for $10 anytime. All plans include a 30% referral program.
        </p>
      </div>
    </section>
  );
}
