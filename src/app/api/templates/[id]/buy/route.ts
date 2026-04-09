import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creditReferralCommission } from "@/lib/referrals";

/**
 * Buy a premium template. Deducts the price from buyer's credits
 * and credits 70% to the template creator (30% platform fee).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

  if (!template.isPremium || !template.price) {
    return NextResponse.json({ error: "This template is free" }, { status: 400 });
  }

  // Check buyer has enough credits
  const buyer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true },
  });
  if (!buyer || buyer.credits < template.price) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  const creatorCut = Math.round(template.price * 0.7 * 100) / 100; // 70% to creator
  const platformFee = template.price - creatorCut; // 30% platform fee

  await prisma.$transaction([
    // Deduct from buyer
    prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { decrement: template.price } },
    }),
    // Record buyer's transaction
    prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "template_purchase",
        amount: template.price,
        currency: "CREDITS",
        status: "completed",
        provider: "internal",
        providerId: template.id,
      },
    }),
    // Credit creator
    ...(template.creatorId
      ? [
          prisma.transaction.create({
            data: {
              userId: template.creatorId,
              type: "template_sale",
              amount: creatorCut,
              currency: "USD",
              status: "pending", // pending payout
              provider: "internal",
              providerId: template.id,
            },
          }),
        ]
      : []),
    // Increment usage count
    prisma.template.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ success: true, message: "Template purchased" });
}
