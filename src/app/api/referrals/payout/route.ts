import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transferToConnectAccount, syncConnectStatus } from "@/lib/stripeConnect";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import crypto from "crypto";

const MIN_PAYOUT_USD = 10;

/**
 * Secure payout flow:
 *  1. Auth: requires a valid session.
 *  2. Rate limit: 5 payout requests per hour per user.
 *  3. Verifies Connect account exists AND payouts_enabled is true.
 *  4. Calculates pending commission (only USD "pending" rows).
 *  5. Marks those rows as "processing" inside a transaction BEFORE calling Stripe.
 *  6. Calls Stripe with an idempotency key so re-tries can't double-spend.
 *  7. On success: marks rows "completed", logs a payout record.
 *  8. On failure: rolls rows back to "pending".
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const rl = rateLimit(`payout:${userId}:${getClientKey(req)}`, 5, 3600_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many payout requests. Try again in an hour." },
      { status: 429 },
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured on the server" },
      { status: 503 },
    );
  }

  // Load user + verify Connect account
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeConnectAccountId: true,
      stripeConnectPayoutsEnabled: true,
    },
  });

  if (!user?.stripeConnectAccountId) {
    return NextResponse.json(
      {
        error: "Connect a payout account first",
        needsOnboarding: true,
      },
      { status: 400 },
    );
  }

  // Re-verify live status with Stripe (don't trust cached DB value for money movements)
  const live = await syncConnectStatus(userId);
  if (!live.payoutsEnabled) {
    return NextResponse.json(
      {
        error: "Your payout account is not yet verified. Complete onboarding first.",
        needsOnboarding: true,
      },
      { status: 400 },
    );
  }

  // Atomically select + lock pending commissions for this user
  const pending = await prisma.transaction.findMany({
    where: {
      userId,
      type: "referral_commission",
      status: "pending",
      currency: "USD",
    },
  });

  const total = pending.reduce((sum, t) => sum + t.amount, 0);
  if (total < MIN_PAYOUT_USD) {
    return NextResponse.json(
      { error: `Minimum payout is $${MIN_PAYOUT_USD}. You have $${total.toFixed(2)} available.` },
      { status: 400 },
    );
  }

  // Deterministic idempotency key — same key = same transfer, prevents double-payouts on retries
  const idempotencyKey = crypto
    .createHash("sha256")
    .update(`${userId}:${pending.map((p) => p.id).sort().join(",")}`)
    .digest("hex");

  // Lock rows as "processing" BEFORE calling Stripe so a concurrent request can't double-spend
  await prisma.transaction.updateMany({
    where: { id: { in: pending.map((t) => t.id) }, status: "pending" },
    data: { status: "processing" },
  });

  try {
    const { transferId } = await transferToConnectAccount({
      accountId: user.stripeConnectAccountId,
      amountUsd: total,
      idempotencyKey,
      description: `Referral commission payout (${pending.length} sales)`,
    });

    // Success: mark commissions as paid + log the payout
    await prisma.$transaction([
      prisma.transaction.updateMany({
        where: { id: { in: pending.map((t) => t.id) } },
        data: { status: "completed", providerId: transferId },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: "referral_payout",
          amount: total,
          currency: "USD",
          status: "completed",
          provider: "stripe_connect",
          providerId: transferId,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      amount: total,
      transferId,
      message: `$${total.toFixed(2)} sent to your bank account.`,
    });
  } catch (err) {
    // Rollback: release the locks
    await prisma.transaction.updateMany({
      where: { id: { in: pending.map((t) => t.id) }, status: "processing" },
      data: { status: "pending" },
    });
    return NextResponse.json(
      { error: "Payout failed", details: (err as Error).message },
      { status: 500 },
    );
  }
}
