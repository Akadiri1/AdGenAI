import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ReferralClient } from "./ReferralClient";

export const dynamic = "force-dynamic";

export default async function ReferralPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-text-secondary">Please log in</p>
        <Link href="/auth/login" className="text-primary font-semibold">Log in</Link>
      </div>
    );
  }

  const userId = session.user.id;
  const [user, referrals, commissionTxs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true,
        stripeConnectAccountId: true, stripeConnectPayoutsEnabled: true,
      },
    }),
    prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: { userId, type: "referral_commission" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const referralCode = user?.id.slice(0, 8).toUpperCase() ?? "";
  const pendingPayout = commissionTxs
    .filter((t) => t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);
  const paidOut = commissionTxs
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const stats = {
    total: referrals.length,
    signedUp: referrals.filter((r) => r.status === "signed_up" || r.status === "converted").length,
    converted: referrals.filter((r) => r.status === "converted").length,
    earnings: referrals.reduce((sum, r) => sum + r.commission, 0),
    pendingPayout,
    paidOut,
  };

  return (
    <ReferralClient
      referralCode={referralCode}
      stats={stats}
      referrals={JSON.parse(JSON.stringify(referrals))}
      connectStatus={{
        hasAccount: !!user?.stripeConnectAccountId,
        payoutsEnabled: user?.stripeConnectPayoutsEnabled ?? false,
      }}
    />
  );
}
