import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Cancel subscription — downgrades user to FREE plan.
 * Credits are kept (they don't expire). User just stops receiving monthly credits.
 * If Stripe is configured, also cancels the Stripe subscription.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, credits: true },
  });

  if (!user || user.plan === "FREE") {
    return NextResponse.json({ error: "You're already on the Free plan" }, { status: 400 });
  }

  // If Stripe is configured, cancel the subscription there too
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const { getStripe } = await import("@/lib/stripe");
      const stripe = getStripe();

      // Find active subscriptions for this user via their transactions
      const lastSub = await prisma.transaction.findFirst({
        where: { userId: session.user.id, type: "subscription", provider: "stripe" },
        orderBy: { createdAt: "desc" },
      });

      if (lastSub?.providerId) {
        // Try to find and cancel the Stripe subscription
        const checkoutSession = await stripe.checkout.sessions.retrieve(lastSub.providerId);
        if (checkoutSession.subscription) {
          const subId = typeof checkoutSession.subscription === "string"
            ? checkoutSession.subscription
            : checkoutSession.subscription.id;
          await stripe.subscriptions.cancel(subId);
        }
      }
    } catch {
      // Stripe cancellation failed — still downgrade locally
      console.error("[billing] Stripe cancel failed, downgrading locally only");
    }
  }

  // Downgrade to FREE — keep existing credits
  await prisma.user.update({
    where: { id: session.user.id },
    data: { plan: "FREE" },
  });

  // Log the cancellation
  await prisma.transaction.create({
    data: {
      userId: session.user.id,
      type: "cancellation",
      amount: 0,
      currency: "USD",
      status: "completed",
      provider: "internal",
    },
  });

  return NextResponse.json({
    success: true,
    message: "Subscription canceled. You're now on the Free plan. Your credits are still available.",
  });
}
