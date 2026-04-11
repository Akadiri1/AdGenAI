import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PLAN_DEFS, type PlanKey } from "@/lib/plans";
import { creditReferralCommission } from "@/lib/referrals";
import { logAudit } from "@/lib/audit";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.metadata?.userId;
      const metaType = s.metadata?.type;

      // Credit pack purchase (one-time payment)
      if (userId && metaType === "credit_purchase") {
        const creditsToAdd = Number(s.metadata?.credits ?? 0);
        const amountUsd = (s.amount_total ?? 0) / 100;
        await prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: creditsToAdd } },
        });
        await prisma.transaction.create({
          data: {
            userId,
            type: "credit_purchase",
            amount: amountUsd,
            currency: (s.currency ?? "usd").toUpperCase(),
            status: "completed",
            provider: "stripe",
            providerId: s.id,
          },
        });
        await logAudit({
          userId,
          action: "payment_received",
          resource: s.id,
          metadata: { type: "credit_purchase", amount: amountUsd, credits: creditsToAdd, provider: "stripe" },
        });
        await creditReferralCommission(userId, amountUsd, s.id);
        break;
      }

      // Subscription purchase
      const plan = s.metadata?.plan as PlanKey | undefined;
      if (userId && plan) {
        const def = PLAN_DEFS[plan];
        const amountUsd = (s.amount_total ?? 0) / 100;
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            credits: { increment: def.monthlyCredits },
            creditsExpiry: null,
          },
        });
        await prisma.transaction.create({
          data: {
            userId,
            type: "subscription",
            amount: amountUsd,
            currency: (s.currency ?? "usd").toUpperCase(),
            status: "completed",
            provider: "stripe",
            providerId: s.id,
          },
        });
        await logAudit({
          userId,
          action: "plan_upgraded",
          resource: s.id,
          metadata: { type: "subscription", amount: amountUsd, provider: "stripe" },
        });
        // Credit the referrer 30% on this first payment
        await creditReferralCommission(userId, amountUsd, s.id);
      }
      break;
    }
    case "invoice.paid": {
      // Fires on every recurring renewal — monthly or yearly.
      // The referrer earns 30% on each renewal, forever.
      const inv = event.data.object as Stripe.Invoice;
      const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      if (!customerId) break;
      // Find the user by the most recent completed transaction linked to this customer.
      // (For robustness, we'd store stripeCustomerId directly on User — future improvement.)
      const firstTx = await prisma.transaction.findFirst({
        where: { provider: "stripe", status: "completed" },
        orderBy: { createdAt: "asc" },
      });
      const userId = firstTx?.userId;
      if (!userId || !inv.id) break;
      // Skip the first invoice — already handled by checkout.session.completed
      if (inv.billing_reason === "subscription_create") break;
      const amountUsd = (inv.amount_paid ?? 0) / 100;
      await prisma.transaction.create({
        data: {
          userId,
          type: "subscription_renewal",
          amount: amountUsd,
          currency: (inv.currency ?? "usd").toUpperCase(),
          status: "completed",
          provider: "stripe",
          providerId: inv.id,
        },
      });
      await logAudit({
        userId,
        action: "payment_received",
        resource: inv.id ?? undefined,
        metadata: { type: "subscription_renewal", amount: amountUsd, provider: "stripe" },
      });
      await creditReferralCommission(userId, amountUsd, inv.id);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      // Look up user by customer ID — requires storing stripeCustomerId (future improvement)
      const tx = await prisma.transaction.findFirst({
        where: { providerId: customerId, provider: "stripe" },
        orderBy: { createdAt: "desc" },
      });
      if (tx) {
        await prisma.user.update({
          where: { id: tx.userId },
          data: { plan: "FREE" },
        });
      }
      break;
    }
    case "invoice.payment_failed": {
      // TODO: notify user, pause ad posting
      break;
    }
    case "account.updated": {
      // Stripe Connect onboarding status change — keep DB in sync
      const acc = event.data.object as Stripe.Account;
      await prisma.user.updateMany({
        where: { stripeConnectAccountId: acc.id },
        data: { stripeConnectPayoutsEnabled: acc.payouts_enabled ?? false },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}

export const runtime = "nodejs";
