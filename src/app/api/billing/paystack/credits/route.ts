import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializeTransaction } from "@/lib/paystack";
import { CREDIT_PACK_PRICE_USD, CREDIT_PACK_AMOUNT } from "@/lib/plans";
import { convertUsdToLocal } from "@/lib/currency";
import { z } from "zod";

const bodySchema = z.object({
  packs: z.number().int().min(1).max(20).default(1),
  currency: z.enum(["NGN", "GHS", "ZAR", "KES"]).default("NGN"),
});

/**
 * Buy additional credit packs via Paystack.
 * Available to PRO and BUSINESS users only.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await req.json();
    const { packs, currency } = bodySchema.parse(json);

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
    
    if (!user.email) {
      return NextResponse.json({ error: "Email required on account" }, { status: 400 });
    }

    const totalCredits = packs * CREDIT_PACK_AMOUNT;
    const totalUsd = packs * CREDIT_PACK_PRICE_USD;
    const localAmount = convertUsdToLocal(totalUsd, currency);
    const amountKobo = Math.round(localAmount * 100);

    const origin = new URL(req.url).origin;
    const reference = `adg_credits_${session.user.id.slice(0, 8)}_${Date.now()}`;

    const result = await initializeTransaction({
      email: user.email,
      amountKobo,
      currency,
      reference,
      callbackUrl: `${origin}/api/billing/paystack/callback`,
      metadata: { 
        userId: session.user.id, 
        type: "credit_purchase", 
        credits: totalCredits,
        usdAmount: totalUsd
      },
    });

    return NextResponse.json({ url: result.data.authorization_url, reference });
  } catch (err) {
    console.error("Paystack credits init error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
