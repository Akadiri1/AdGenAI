import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateConnectAccount, createOnboardingLink } from "@/lib/stripeConnect";

/**
 * Kicks off Stripe Connect onboarding.
 * Returns a single-use URL where the user completes KYC (bank details, ID, tax info).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured on the server" },
      { status: 503 },
    );
  }

  try {
    const { accountId } = await getOrCreateConnectAccount(session.user.id);
    const origin = new URL(req.url).origin;
    const url = await createOnboardingLink(accountId, origin);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: "Could not start onboarding", details: (err as Error).message },
      { status: 500 },
    );
  }
}
