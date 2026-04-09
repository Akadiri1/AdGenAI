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

  const { userId, plan } = result.data.metadata as { userId: string; plan: PlanKey };
  if (userId && plan) {
    const def = PLAN_DEFS[plan];
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        credits: { increment: def.monthlyCredits },
        creditsExpiry: null,
      },
    });
    const paidAmount = result.data.amount / 100;
    await prisma.transaction.create({
      data: {
        userId,
        type: "subscription",
        amount: paidAmount,
        currency: result.data.currency,
        status: "completed",
        provider: "paystack",
        providerId: reference,
      },
    });
    // Approximate USD for commission: Paystack amounts are in local currency.
    // For now, we record commission in the local currency; convert at payout time.
    await creditReferralCommission(userId, paidAmount, reference);
  }

  return NextResponse.redirect(new URL("/settings/billing?success=1", req.url));
}
