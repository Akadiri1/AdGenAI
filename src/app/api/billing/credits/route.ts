import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { CREDIT_PACK_PRICE_USD, CREDIT_PACK_AMOUNT } from "@/lib/plans";
import { z } from "zod";

const bodySchema = z.object({
  packs: z.number().int().min(1).max(20).default(1),
});

/**
 * Buy additional credit packs. Each pack = 10 credits for $3.
 * Available to PRO and BUSINESS users only.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, email: true },
  });
  if (!user || user.plan === "FREE") {
    return NextResponse.json(
      { error: "Credit packs are available on Pro and Business plans. Upgrade first." },
      { status: 402 },
    );
  }

  const { packs } = bodySchema.parse(await req.json());
  const totalCredits = packs * CREDIT_PACK_AMOUNT;
  const totalUsd = packs * CREDIT_PACK_PRICE_USD;

  if (!process.env.STRIPE_SECRET_KEY) {
    // Dev fallback: just add credits directly
    await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { increment: totalCredits } },
    });
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "credit_purchase",
        amount: totalUsd,
        currency: "USD",
        status: "completed",
        provider: "dev_bypass",
      },
    });
    return NextResponse.json({ success: true, credits: totalCredits });
  }

  const stripe = getStripe();
  const origin = new URL(req.url).origin;
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: CREDIT_PACK_PRICE_USD * 100,
          product_data: {
            name: `Famousli Credit Pack (${CREDIT_PACK_AMOUNT} credits)`,
            description: `${CREDIT_PACK_AMOUNT} ad credits that never expire`,
          },
        },
        quantity: packs,
      },
    ],
    customer_email: user.email ?? undefined,
    client_reference_id: session.user.id,
    metadata: { userId: session.user.id, type: "credit_purchase", credits: String(totalCredits) },
    success_url: `${origin}/settings/billing?credits_purchased=${totalCredits}`,
    cancel_url: `${origin}/settings/billing?canceled=1`,
  });

  return NextResponse.json({ url: checkout.url });
}
