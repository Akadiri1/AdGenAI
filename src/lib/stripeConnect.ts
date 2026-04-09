import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/**
 * Creates a Stripe Connect Express account for a user, or returns their existing one.
 * Express accounts are the simplest: Stripe hosts the onboarding UI, handles KYC,
 * manages tax forms, and we just transfer money to them.
 *
 * Security notes:
 * - We never see or store bank details — they live on Stripe's side.
 * - account ID is scoped to a user (unique) so it can't be hijacked.
 * - payouts_enabled must be true before we permit transfers.
 */
export async function getOrCreateConnectAccount(userId: string): Promise<{
  accountId: string;
  payoutsEnabled: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeConnectAccountId: true,
      stripeConnectPayoutsEnabled: true,
      email: true,
      country: true,
    },
  });
  if (!user) throw new Error("User not found");

  if (user.stripeConnectAccountId) {
    return {
      accountId: user.stripeConnectAccountId,
      payoutsEnabled: user.stripeConnectPayoutsEnabled,
    };
  }

  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    email: user.email ?? undefined,
    country: user.country ?? "US",
    capabilities: {
      transfers: { requested: true },
    },
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeConnectAccountId: account.id },
  });

  return { accountId: account.id, payoutsEnabled: false };
}

/**
 * Creates a one-time onboarding link for the user to complete KYC.
 * Links expire after 5 minutes and are single-use.
 */
export async function createOnboardingLink(
  accountId: string,
  origin: string,
): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/referral?connect=refresh`,
    return_url: `${origin}/referral?connect=done`,
    type: "account_onboarding",
  });
  return link.url;
}

/**
 * Syncs the live Connect account status (payouts_enabled, charges_enabled)
 * back to our DB. Safe to call on demand.
 */
export async function syncConnectStatus(userId: string): Promise<{
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeConnectAccountId: true },
  });
  if (!user?.stripeConnectAccountId) {
    return { payoutsEnabled: false, detailsSubmitted: false };
  }

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);

  await prisma.user.update({
    where: { id: userId },
    data: { stripeConnectPayoutsEnabled: account.payouts_enabled ?? false },
  });

  return {
    payoutsEnabled: account.payouts_enabled ?? false,
    detailsSubmitted: account.details_submitted ?? false,
  };
}

/**
 * Transfers USD from the platform balance to a user's Connect account.
 * Uses idempotency to prevent double-transfers.
 */
export async function transferToConnectAccount(params: {
  accountId: string;
  amountUsd: number;
  idempotencyKey: string;
  description: string;
}): Promise<{ transferId: string }> {
  const stripe = getStripe();
  const transfer = await stripe.transfers.create(
    {
      amount: Math.round(params.amountUsd * 100), // Stripe uses cents
      currency: "usd",
      destination: params.accountId,
      description: params.description,
    },
    { idempotencyKey: params.idempotencyKey },
  );
  return { transferId: transfer.id };
}
