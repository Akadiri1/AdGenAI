import { prisma } from "@/lib/prisma";

export const REFEREE_BONUS_CREDITS = 2;
export const REFERRAL_COMMISSION_RATE = 0.2; // 20% commission (cashback)

/**
 * Resolves a referral code to a user ID. Codes are the first 8 chars of the user ID, uppercased.
 */
export async function findReferrer(code: string): Promise<string | null> {
  if (!code || code.length < 4) return null;
  const users = await prisma.user.findMany({
    where: { id: { startsWith: code.toLowerCase() } },
    select: { id: true },
    take: 2,
  });
  if (users.length !== 1) return null;
  return users[0].id;
}

/**
 * Called when a new user signs up. If they arrived via a referral code,
 * credits them with bonus credits, marks them as referred, and creates
 * a Referral record on the referrer's account.
 */
export async function applyReferralOnSignup(
  newUserId: string,
  referralCode: string,
): Promise<void> {
  const referrerId = await findReferrer(referralCode);
  if (!referrerId || referrerId === newUserId) return; // can't refer yourself

  // Grab referee's email/phone for the referral record
  const newUser = await prisma.user.findUnique({
    where: { id: newUserId },
    select: { email: true, phone: true, referredBy: true },
  });
  if (!newUser || newUser.referredBy) return; // already has a referrer, don't overwrite

  await prisma.$transaction([
    // Mark new user as referred + give bonus credits
    prisma.user.update({
      where: { id: newUserId },
      data: {
        referredBy: referrerId,
        credits: { increment: REFEREE_BONUS_CREDITS },
      },
    }),
    // Create referral record
    prisma.referral.create({
      data: {
        referrerId,
        referredEmail: newUser.email,
        referredPhone: newUser.phone,
        status: "signed_up",
        commission: 0,
      },
    }),
  ]);
}

/**
 * Called on every successful paid invoice. If the paying user was referred,
 * credits the referrer with 20% commission and updates the referral record.
 */
export async function creditReferralCommission(
  payingUserId: string,
  paidAmountUsd: number,
  invoiceId: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: payingUserId },
    select: { referredBy: true, email: true },
  });
  if (!user?.referredBy) return;

  const commission = paidAmountUsd * REFERRAL_COMMISSION_RATE;

  // Find the Referral record (there can be only one active per referee email)
  const referral = await prisma.referral.findFirst({
    where: {
      referrerId: user.referredBy,
      referredEmail: user.email,
    },
  });

  if (!referral) {
    // Backfill: no referral record existed (pre-signup tracking edge case)
    await prisma.referral.create({
      data: {
        referrerId: user.referredBy,
        referredEmail: user.email,
        status: "converted",
        commission,
      },
    });
  } else {
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: "converted",
        commission: { increment: commission },
      },
    });
  }

  // Also log a payout entry so the referrer can see what they've earned
  await prisma.transaction.create({
    data: {
      userId: user.referredBy,
      type: "referral_commission",
      amount: commission,
      currency: "USD",
      status: "pending", // "pending" payout — reset to "paid" when payout sent
      provider: "internal",
      providerId: invoiceId,
    },
  });
}
