import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializeTransaction } from "@/lib/paystack";
import { PLAN_DEFS, type PlanKey, type BillingCycle } from "@/lib/plans";
import { z } from "zod";

const bodySchema = z.object({
  plan: z.enum(["PRO", "BUSINESS"]),
  cycle: z.enum(["monthly", "yearly"]),
  currency: z.enum(["NGN", "GHS", "ZAR", "KES"]).default("NGN"),
});

// Rough FX — in production fetch daily rates
const USD_TO: Record<string, number> = { NGN: 1500, GHS: 12, ZAR: 18, KES: 130 };

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan, cycle, currency } = bodySchema.parse(await req.json()) as {
    plan: PlanKey;
    cycle: BillingCycle;
    currency: "NGN" | "GHS" | "ZAR" | "KES";
  };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  if (!user?.email) {
    return NextResponse.json({ error: "Email required on account" }, { status: 400 });
  }

  const def = PLAN_DEFS[plan];
  const usdAmount = cycle === "monthly" ? def.priceMonthlyUsd : def.priceYearlyUsd;
  const localAmount = usdAmount * (USD_TO[currency] ?? 1);
  const amountKobo = Math.round(localAmount * 100); // paystack uses lowest unit

  const origin = new URL(req.url).origin;
  const reference = `adg_${session.user.id.slice(0, 8)}_${Date.now()}`;

  const result = await initializeTransaction({
    email: user.email,
    amountKobo,
    currency,
    reference,
    callbackUrl: `${origin}/api/billing/paystack/callback`,
    metadata: { userId: session.user.id, plan, cycle },
  });

  return NextResponse.json({ url: result.data.authorization_url, reference });
}
