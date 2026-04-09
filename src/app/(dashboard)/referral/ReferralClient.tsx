"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Wallet, BadgeCheck, ExternalLink, Users, UserCheck, Gem, Gift } from "lucide-react";

type Referral = {
  id: string;
  referredEmail: string | null;
  referredPhone: string | null;
  status: string;
  commission: number;
  createdAt: string;
};

type ClientProps = {
  referralCode: string;
  stats: { total: number; signedUp: number; converted: number; earnings: number; pendingPayout: number; paidOut: number };
  referrals: Referral[];
  connectStatus: { hasAccount: boolean; payoutsEnabled: boolean };
};

export function ReferralClient(props: ClientProps) {
  return (
    <Suspense fallback={<div className="p-6 text-text-secondary">Loading...</div>}>
      <ReferralClientInner {...props} />
    </Suspense>
  );
}

function ReferralClientInner({
  referralCode,
  stats,
  referrals,
  connectStatus: initialConnectStatus,
}: ClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: toastError } = useToast();
  const [copied, setCopied] = useState(false);
  const [cashingOut, setCashingOut] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectStatus, setConnectStatus] = useState(initialConnectStatus);

  // Returning from Stripe onboarding? Re-check status.
  useEffect(() => {
    if (searchParams.get("connect") === "done") {
      fetch("/api/referrals/connect/status")
        .then((r) => r.json())
        .then((data) => {
          if (typeof data.payoutsEnabled === "boolean") {
            setConnectStatus({
              hasAccount: true,
              payoutsEnabled: data.payoutsEnabled,
            });
            if (data.payoutsEnabled) success("Payout account verified!");
          }
        })
        .catch(() => {});
    }
  }, [searchParams, success]);

  async function startOnboarding() {
    setConnecting(true);
    try {
      const res = await fetch("/api/referrals/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start onboarding");
      window.location.href = data.url;
    } catch (err) {
      toastError((err as Error).message);
      setConnecting(false);
    }
  }

  async function cashOut() {
    setCashingOut(true);
    try {
      const res = await fetch("/api/referrals/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "stripe" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsOnboarding) {
          toastError("Finish setting up your payout account first");
          return;
        }
        throw new Error(data.error ?? "Payout failed");
      }
      success(data.message ?? "Payout sent");
      router.refresh();
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setCashingOut(false);
    }
  }
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/signup?r=${referralCode}`
      : `https://adgenai.com/auth/signup?r=${referralCode}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Try AdGenAI",
          text: "Create professional ads in 30 seconds with AI. Get 5 bonus credits on signup!",
          url: link,
        });
      } catch {
        // user canceled
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-text-primary">Referrals</h1>
        <p className="text-text-secondary">Earn 30% recurring commission for every paying customer you refer</p>
      </div>

      <div className="rounded-3xl gradient-bg animate-gradient p-8 text-white">
        <h2 className="font-heading text-2xl font-bold mb-2">Your referral link</h2>
        <p className="text-white/90 mb-4 text-sm">
          Share this link. Referred users get 5 bonus credits. You get 30% of their subscription, forever.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={link}
            readOnly
            className="flex-1 rounded-xl bg-white/20 px-4 py-3 text-sm font-mono text-white backdrop-blur placeholder:text-white/50 outline-none"
          />
          <button
            onClick={handleCopy}
            className="h-12 rounded-xl bg-white px-5 text-sm font-semibold text-primary transition-all hover:shadow-lg"
          >
            {copied ? "✓ Copied!" : "Copy link"}
          </button>
          <button
            onClick={handleShare}
            className="h-12 rounded-xl border-2 border-white/30 px-5 text-sm font-semibold text-white transition-all hover:bg-white/10"
          >
            Share
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <Users className="mb-1 h-6 w-6 text-text-secondary" />
          <div className="font-heading text-2xl font-bold text-text-primary">{stats.total}</div>
          <div className="text-sm text-text-secondary">Total invites</div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <UserCheck className="mb-1 h-6 w-6 text-success" />
          <div className="font-heading text-2xl font-bold text-text-primary">{stats.signedUp}</div>
          <div className="text-sm text-text-secondary">Signed up</div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <Gem className="mb-1 h-6 w-6 text-accent" />
          <div className="font-heading text-2xl font-bold text-text-primary">{stats.converted}</div>
          <div className="text-sm text-text-secondary">Paying customers</div>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
          <Wallet className="mb-1 h-6 w-6 text-primary" />
          <div className="font-heading text-2xl font-bold text-primary">${stats.earnings.toFixed(2)}</div>
          <div className="text-sm text-text-secondary">Total earned</div>
        </div>
      </div>

      {/* Payout account panel — Stripe Connect onboarding */}
      {stats.pendingPayout > 0 && (
        !connectStatus.hasAccount || !connectStatus.payoutsEnabled ? (
          <div className="rounded-2xl border-2 border-warning/20 bg-warning/5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-warning text-white">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-heading font-bold text-text-primary mb-1">
                  Set up your payout account
                </div>
                <p className="text-sm text-text-secondary mb-3">
                  Connect a bank account via Stripe to cash out your earnings. Takes 2 minutes. Stripe handles KYC and sends money directly to your bank — we never see your bank details.
                </p>
                <button
                  onClick={startOnboarding}
                  disabled={connecting}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-all"
                >
                  {connecting ? "Loading..." : "Connect bank account"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-success/20 bg-success/5 px-5 py-3">
            <div className="flex items-center gap-2 text-sm">
              <BadgeCheck className="h-5 w-5 text-success flex-shrink-0" />
              <span className="font-semibold text-success">Payout account verified</span>
              <span className="text-text-secondary">· Ready to cash out anytime</span>
            </div>
          </div>
        )
      )}

      {(stats.pendingPayout > 0 || stats.paidOut > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-success/20 bg-success/5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                  Available to cash out
                </div>
                <div className="font-heading text-3xl font-bold text-success">
                  ${stats.pendingPayout.toFixed(2)}
                </div>
                <div className="mt-1 text-xs text-text-secondary">
                  Credited instantly when your referrals pay. Minimum $10 to cash out.
                </div>
              </div>
              <button
                onClick={cashOut}
                disabled={cashingOut || stats.pendingPayout < 10 || !connectStatus.payoutsEnabled}
                className="flex h-11 items-center gap-1.5 rounded-xl bg-success px-4 text-sm font-semibold text-white shadow-md hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title={!connectStatus.payoutsEnabled ? "Connect a payout account first" : undefined}
              >
                <Wallet className="h-4 w-4" />
                {cashingOut ? "..." : "Cash out"}
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Paid out so far
            </div>
            <div className="font-heading text-3xl font-bold text-text-primary">
              ${stats.paidOut.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="font-heading font-bold text-text-primary mb-4">Recent Referrals</h3>
        {referrals.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-secondary"><Gift className="h-8 w-8 text-text-secondary" /></div>
            <p className="font-heading font-semibold text-text-primary mb-1">No referrals yet</p>
            <p className="text-sm text-text-secondary">Share your link to start earning</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-black/5 p-3 text-sm">
                <div>
                  <div className="font-semibold text-text-primary">
                    {r.referredEmail ?? r.referredPhone ?? "Anonymous"}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      r.status === "converted"
                        ? "bg-success/10 text-success"
                        : r.status === "signed_up"
                          ? "bg-accent/10 text-accent"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {r.status}
                  </span>
                  <span className="font-heading font-bold text-text-primary">${r.commission.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="font-heading font-bold text-text-primary mb-4">How it works</h3>
        <div className="space-y-4 text-sm text-text-secondary">
          <div className="flex gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">1</span>
            <p><strong className="text-text-primary">Share your link</strong> with friends, clients, or on social media.</p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">2</span>
            <p><strong className="text-text-primary">They sign up</strong> and get 5 bonus credits. You get credit for the referral.</p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">3</span>
            <p>
              <strong className="text-text-primary">They pay, you earn — instantly.</strong>{" "}
              The moment they subscribe (Starter $49 → $14.70, Pro $129 → $38.70, Business $299 → $89.70) your commission is credited instantly.
              Every renewal adds more — as long as they stay subscribed, you keep earning.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">4</span>
            <p>
              <strong className="text-text-primary">Cash out anytime</strong> — there's no waiting period.
              As soon as your balance hits $10, click Cash out and money goes straight to your bank via Stripe (1-2 business days to arrive).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
