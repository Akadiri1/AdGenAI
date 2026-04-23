import { NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { PLAN_DEFS, type PlanKey } from "@/lib/plans";
import { creditReferralCommission } from "@/lib/referrals";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference");
  if (!reference) {
    return NextResponse.redirect(new URL("/settings/billing?error=missing_ref", req.url));
  }

  const result = await verifyTransaction(reference);
  if (!result.status || result.data.status !== "success") {
    return NextResponse.redirect(new URL("/settings/billing?error=payment_failed", req.url));
  }

  const { userId, plan, type, credits, usdAmount } = result.data.metadata as {
    userId: string;
    plan?: PlanKey;
    type?: string;
    credits?: number;
    usdAmount?: number;
  };

  if (userId) {
    const paidAmount = result.data.amount / 100;
    const finalType = type ?? (plan ? "subscription" : "credit_purchase");

    if (plan && PLAN_DEFS[plan]) {
      const def = PLAN_DEFS[plan];
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan,
          credits: { increment: def.monthlyCredits },
          creditsExpiry: null,
        },
      });
    } else if (credits && credits > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: credits } },
      });
    }

    await prisma.transaction.create({
      data: {
        userId,
        type: finalType,
        amount: paidAmount,
        currency: result.data.currency,
        status: "completed",
        provider: "paystack",
        providerId: reference,
      },
    });

    // For commission, use USD amount if available (to keep it consistent with Stripe)
    await creditReferralCommission(userId, usdAmount ?? paidAmount, reference);
  }

  const successUrl = new URL("/settings/billing", req.url);
  successUrl.searchParams.set("success", "1");
  if (credits) successUrl.searchParams.set("credits_purchased", String(credits));

  return NextResponse.redirect(successUrl);
}
