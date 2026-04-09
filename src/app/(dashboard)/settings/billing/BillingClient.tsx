"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { PLAN_DEFS, type PlanKey, type BillingCycle } from "@/lib/plans";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  createdAt: string;
};

const AFRICAN_COUNTRIES = ["NG", "GH", "ZA", "KE", "CI", "EG", "RW"];

export function BillingClient({
  currentPlan,
  credits,
  country,
  transactions,
  message,
}: {
  currentPlan: string;
  credits: number;
  country: string | null;
  transactions: Transaction[];
  message: string | null;
}) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const showPaystack = country ? AFRICAN_COUNTRIES.includes(country) : false;

  async function handleCancel() {
    setCanceling(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Cancel failed");
      window.location.reload();
    } catch (err) {
      setError((err as Error).message);
      setCanceling(false);
      setConfirmCancel(false);
    }
  }

  async function subscribe(plan: PlanKey, provider: "stripe" | "paystack") {
    setProcessing(`${plan}-${provider}`);
    setError(null);
    try {
      const endpoint =
        provider === "stripe" ? "/api/billing/checkout" : "/api/billing/paystack/init";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle, ...(provider === "paystack" && { currency: "NGN" }) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
      setProcessing(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-text-primary">Billing & Plan</h1>
        <p className="text-text-secondary">Manage your subscription and credits</p>
      </div>

      {message === "success" && (
        <div className="rounded-2xl border border-success/20 bg-success/10 p-4 text-sm text-success font-semibold">
          <CheckCircle className="inline h-4 w-4" /> Payment successful! Your plan has been upgraded.
        </div>
      )}
      {message === "canceled" && (
        <div className="rounded-2xl border border-warning/20 bg-warning/10 p-4 text-sm text-warning font-semibold">
          Checkout canceled. No charge was made.
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger font-semibold">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Current plan</div>
          <div className="font-heading text-2xl font-bold text-text-primary">{currentPlan}</div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Credits</div>
          <div className="font-heading text-2xl font-bold text-text-primary">{credits}</div>
          <div className="text-xs text-text-secondary mt-1">Roll over monthly</div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Auto-renew</div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-semibold text-success">Active</span>
          </div>
          <div className="text-xs text-text-secondary mt-1">Card charged on renewal</div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Last payment</div>
          <div className="font-heading text-2xl font-bold text-text-primary">
            {transactions[0] ? `${transactions[0].currency} ${transactions[0].amount.toFixed(0)}` : "—"}
          </div>
        </div>
      </div>

      {/* Cancel subscription */}
      {currentPlan !== "FREE" && (
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-heading font-bold text-text-primary">Cancel subscription</div>
              <p className="text-sm text-text-secondary mt-0.5">
                Downgrade to Free plan. Your credits stay — you just won&apos;t get new ones monthly. You can re-subscribe anytime.
              </p>
            </div>
            {confirmCancel ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-text-secondary">Are you sure?</span>
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  className="flex h-9 items-center gap-1.5 rounded-xl bg-danger px-4 text-xs font-semibold text-white hover:bg-danger/90 disabled:opacity-50"
                >
                  {canceling ? "Canceling..." : "Yes, cancel"}
                </button>
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="flex h-9 items-center rounded-xl border-2 border-black/10 px-3 text-xs font-semibold text-text-primary hover:bg-bg-secondary"
                >
                  Keep plan
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmCancel(true)}
                className="flex-shrink-0 flex h-9 items-center gap-1.5 rounded-xl border-2 border-danger/20 bg-danger/5 px-4 text-xs font-semibold text-danger hover:bg-danger/10 transition-colors"
              >
                Cancel subscription
              </button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-text-primary">Upgrade your plan</h2>
          <div className="inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white p-1">
            <button
              onClick={() => setCycle("monthly")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                cycle === "monthly" ? "bg-primary text-white" : "text-text-secondary"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                cycle === "yearly" ? "bg-primary text-white" : "text-text-secondary"
              }`}
            >
              Yearly
              <span className="rounded bg-success/20 px-1 py-0.5 text-[9px] font-bold text-success">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {(["STARTER", "PRO", "BUSINESS"] as const).map((planKey) => {
            const def = PLAN_DEFS[planKey];
            const price = cycle === "monthly" ? def.priceMonthlyUsd : def.priceYearlyUsd / 12;
            const isCurrent = currentPlan === planKey;
            const popular = planKey === "PRO";

            return (
              <div
                key={planKey}
                className={`relative rounded-2xl border-2 p-6 transition-all ${
                  popular ? "border-primary bg-primary/5" : "border-black/10 bg-white"
                }`}
              >
                {popular && (
                  <div className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Popular
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-heading text-xl font-bold text-text-primary">{def.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-heading text-3xl font-extrabold text-text-primary">${price.toFixed(0)}</span>
                    <span className="text-sm text-text-secondary">/mo</span>
                  </div>
                  {cycle === "yearly" && (
                    <div className="text-xs text-text-secondary">Billed ${def.priceYearlyUsd}/year</div>
                  )}
                </div>

                <ul className="mb-5 space-y-2 text-sm">
                  {def.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-text-secondary">
                      <svg className="h-4 w-4 flex-shrink-0 text-success mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="rounded-xl border-2 border-success/20 bg-success/10 py-2.5 text-center text-sm font-semibold text-success">
                    ✓ Your current plan
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => subscribe(planKey, "stripe")}
                      disabled={processing === `${planKey}-stripe`}
                      className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                        popular
                          ? "bg-primary text-white hover:bg-primary-dark"
                          : "bg-text-primary text-white hover:bg-text-primary/90"
                      }`}
                    >
                      {processing === `${planKey}-stripe` ? "Loading..." : "Pay with Card (Stripe)"}
                    </button>
                    {showPaystack && (
                      <button
                        onClick={() => subscribe(planKey, "paystack")}
                        disabled={processing === `${planKey}-paystack`}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-black/10 bg-white text-sm font-semibold text-text-primary transition-all hover:bg-bg-secondary disabled:opacity-50"
                      >
                        {processing === `${planKey}-paystack` ? "Loading..." : "Pay with Paystack (NGN)"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Enterprise — full width below */}
        {(() => {
          const def = PLAN_DEFS["ENTERPRISE"];
          const price = cycle === "monthly" ? def.priceMonthlyUsd : def.priceYearlyUsd / 12;
          const isCurrent = currentPlan === "ENTERPRISE";
          return (
            <div className={`mt-4 rounded-2xl border-2 p-6 transition-all ${
              isCurrent ? "border-success bg-success/5" : "border-black/10 bg-gradient-to-r from-secondary/5 via-primary/5 to-accent/5"
            }`}>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left: name + price + CTA */}
                <div className="md:w-48 flex-shrink-0 flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-text-primary">{def.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-heading text-3xl font-extrabold text-text-primary">${price.toFixed(0)}</span>
                      <span className="text-sm text-text-secondary">/mo</span>
                    </div>
                    {cycle === "yearly" && (
                      <div className="text-xs text-text-secondary mt-0.5">Billed ${def.priceYearlyUsd}/year</div>
                    )}
                  </div>
                  <div className="mt-4">
                    {isCurrent ? (
                      <div className="rounded-xl border-2 border-success/20 bg-success/10 py-2.5 text-center text-sm font-semibold text-success">
                        ✓ Your current plan
                      </div>
                    ) : (
                      <a
                        href="mailto:sales@adgenai.com?subject=Enterprise%20Plan%20Inquiry"
                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-secondary to-primary text-sm font-semibold text-white transition-all hover:shadow-lg"
                      >
                        Contact sales
                      </a>
                    )}
                  </div>
                </div>

                {/* Right: features in 3 columns */}
                <div className="flex-1">
                  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2">
                    {def.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                        <svg className="h-4 w-4 flex-shrink-0 text-success mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })()}

        <p className="mt-4 text-center text-xs text-text-secondary">
          Your card is charged automatically on renewal. Cancel anytime — no hidden fees. Credits roll over monthly.
        </p>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="font-heading font-bold text-text-primary mb-4">Transaction History</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-text-secondary py-6 text-center">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-black/5 p-3 text-sm">
                <div>
                  <div className="font-semibold text-text-primary capitalize">{tx.type}</div>
                  <div className="text-xs text-text-secondary">
                    {new Date(tx.createdAt).toLocaleDateString()} · {tx.provider}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-heading font-bold text-text-primary">
                    {tx.currency} {tx.amount.toFixed(2)}
                  </div>
                  <div className={`text-xs font-semibold ${
                    tx.status === "completed" ? "text-success" : "text-text-secondary"
                  }`}>
                    {tx.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
