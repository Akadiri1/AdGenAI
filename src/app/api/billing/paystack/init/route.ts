import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializeTransaction } from "@/lib/paystack";
import { PLAN_DEFS, type PlanKey, type BillingCycle } from "@/lib/plans";
import { convertUsdToLocal } from "@/lib/currency";
import { z } from "zod";

const bodySchema = z.object({
  plan: z.enum(["STARTER", "PRO", "BUSINESS", "ENTERPRISE"]),
  cycle: z.enum(["monthly", "yearly"]),
  currency: z.enum(["NGN", "GHS", "ZAR", "KES"]).default("NGN"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const { plan, cycle, currency } = bodySchema.parse(json);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    if (!user?.email) {
      return NextResponse.json({ error: "Email required on account" }, { status: 400 });
    }

    const def = PLAN_DEFS[plan as PlanKey];
    const usdAmount = cycle === "monthly" ? def.priceMonthlyUsd : def.priceYearlyUsd;
    const localAmount = convertUsdToLocal(usdAmount, currency);
    const amountKobo = Math.round(localAmount * 100);

    const origin = new URL(req.url).origin;
    const reference = `adg_${session.user.id.slice(0, 8)}_${Date.now()}`;

    const result = await initializeTransaction({
      email: user.email,
      amountKobo,
      currency,
      reference,
      plan: def.paystackPlanCodes[cycle as BillingCycle] || undefined,
      callbackUrl: `${origin}/api/billing/paystack/callback`,
      metadata: { userId: session.user.id, plan, cycle },
    });

    return NextResponse.json({ url: result.data.authorization_url, reference });
  } catch (err) {
    console.error("Paystack init error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
