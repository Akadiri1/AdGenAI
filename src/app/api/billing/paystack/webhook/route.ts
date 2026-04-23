import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLAN_DEFS, type PlanKey } from "@/lib/plans";
import { creditReferralCommission } from "@/lib/referrals";
import { logAudit } from "@/lib/audit";
import crypto from "crypto";

/**
 * Paystack webhook handler.
 * Configure URL in Paystack dashboard:
 *   https://YOUR_DOMAIN/api/billing/paystack/webhook
 *
 * Paystack signs every event with HMAC-SHA512 of the request body using your
 * secret key. We verify that signature before trusting the payload.
 */
export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event: string;
    data: {
      reference: string;
      amount: number;
      currency: string;
      status: string;
      customer?: { email?: string };
      metadata?: Record<string, unknown>;
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  switch (event.event) {
    case "charge.success": {
      const { reference, amount, currency, metadata, authorization, customer } = event.data as any;
      const userId = metadata?.userId as string | undefined;
      const plan = metadata?.plan as PlanKey | undefined;
      const type = (metadata?.type as string | undefined) ?? (plan ? "subscription" : "credit_purchase");
      const credits = Number(metadata?.credits ?? 0);
      const usdAmount = Number(metadata?.usdAmount ?? 0);
      const paidAmount = amount / 100;

      if (!userId) break;

      // Idempotency: skip if we've already recorded this transaction
      const existing = await prisma.transaction.findFirst({
        where: { providerId: reference, provider: "paystack" },
      });
      if (existing) break;

      // Update user with plan/credits AND tokenization info
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(plan && PLAN_DEFS[plan] ? {
            plan,
            credits: { increment: PLAN_DEFS[plan].monthlyCredits },
            creditsExpiry: null,
          } : credits > 0 ? {
            credits: { increment: credits }
          } : {}),
          paystackAuthCode: authorization?.authorization_code,
          paystackCustomerId: customer?.customer_code,
        },
      });

      // Record transaction
      await prisma.transaction.create({
        data: {
          userId,
          type,
          amount: paidAmount,
          currency,
          status: "completed",
          provider: "paystack",
          providerId: reference,
        },
      });

      await logAudit({
        userId,
        action: plan ? "plan_upgraded" : "payment_received",
        resource: reference,
        metadata: { type, amount: paidAmount, currency, plan, credits, provider: "paystack" },
      });

      // Referral commission
      await creditReferralCommission(userId, usdAmount > 0 ? usdAmount : paidAmount, reference);
      break;
    }

    case "charge.failed": {
      const { reference, amount, currency, metadata } = event.data;
      const userId = metadata?.userId as string | undefined;
      if (!userId) break;

      await prisma.transaction.create({
        data: {
          userId,
          type: "subscription",
          amount: amount / 100,
          currency,
          status: "failed",
          provider: "paystack",
          providerId: reference,
        },
      });

      await logAudit({
        userId,
        action: "payment_failed",
        resource: reference,
        metadata: { amount: amount / 100, currency, provider: "paystack" },
      });
      break;
    }

    case "subscription.disable":
    case "subscription.not_renew": {
      const userId = event.data.metadata?.userId as string | undefined;
      if (!userId) break;
      await prisma.user.update({
        where: { id: userId },
        data: { plan: "FREE" },
      });
      await logAudit({
        userId,
        action: "plan_canceled",
        metadata: { provider: "paystack", reason: event.event },
      });
      break;
    }

    default:
      // Acknowledge other events without action
      break;
  }

  return NextResponse.json({ received: true });
}
