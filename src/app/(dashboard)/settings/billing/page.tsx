import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BillingClient } from "./BillingClient";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; error?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-text-secondary">Please log in</p>
        <Link href="/auth/login" className="text-primary font-semibold">Log in</Link>
      </div>
    );
  }

  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, credits: true, country: true, currency: true },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const params = await searchParams;

  return (
    <BillingClient
      currentPlan={user?.plan ?? "FREE"}
      credits={user?.credits ?? 0}
      country={user?.country ?? null}
      transactions={JSON.parse(JSON.stringify(transactions))}
      message={params.success ? "success" : params.canceled ? "canceled" : params.error ?? null}
    />
  );
}
