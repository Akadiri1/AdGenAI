import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { PLAN_DEFS, type PlanKey, type BillingCycle } from "@/lib/plans";
import { z } from "zod";

const bodySchema = z.object({
  plan: z.enum(["PRO", "BUSINESS"]),
  cycle: z.enum(["monthly", "yearly"]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan, cycle } = bodySchema.parse(await req.json()) as {
    plan: PlanKey;
    cycle: BillingCycle;
  };

  const priceId = PLAN_DEFS[plan].stripePriceIds[cycle];
  if (!priceId) {
    return NextResponse.json(
      { error: "Price not configured. Set STRIPE_PRICE_* env vars." },
      { status: 503 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  const origin = new URL(req.url).origin;
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user?.email ?? undefined,
    client_reference_id: session.user.id,
    metadata: { userId: session.user.id, plan, cycle },
    success_url: `${origin}/settings/billing?success=1`,
    cancel_url: `${origin}/settings/billing?canceled=1`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkout.url });
}
