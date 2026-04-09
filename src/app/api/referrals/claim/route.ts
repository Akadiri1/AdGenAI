import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { applyReferralOnSignup } from "@/lib/referrals";

/**
 * Called by the client right after a user completes signup / first login.
 * Reads the `referral` cookie set during signup and credits both parties.
 * Idempotent: once the user has `referredBy` set, subsequent calls are no-ops.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const code = cookieStore.get("referral")?.value;
  if (!code) return NextResponse.json({ claimed: false });

  await applyReferralOnSignup(session.user.id, code);

  // Clear the cookie so we don't re-process
  const res = NextResponse.json({ claimed: true });
  res.cookies.set("referral", "", { maxAge: 0, path: "/" });
  return res;
}
