import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DollarSign, TrendingUp, CreditCard, AlertCircle, Crown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage() {
  await requireAdmin();

  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 86400 * 1000);
  const last7 = new Date(now.getTime() - 7 * 86400 * 1000);

  const [
    total, last30Total, last7Total, subsTotal, creditsTotal,
    failed, byPlan, transactions,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { status: "completed" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { status: "completed", createdAt: { gte: last30 } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { status: "completed", createdAt: { gte: last7 } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { status: "completed", type: { in: ["subscription", "subscription_renewal"] } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { status: "completed", type: "credit_purchase" },
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where: { status: "failed" } }),
    prisma.user.groupBy({
      by: ["plan"],
      where: { plan: { in: ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"] } },
      _count: true,
    }),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, email: true, name: true } } },
    }),
  ]);

  const mrr = last30Total._sum.amount ?? 0;
  const arr = mrr * 12;
  const totalAmount = total._sum.amount ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Revenue</h1>
        <p className="text-text-secondary text-sm">Subscription revenue, credit purchases, and MRR</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RevCard icon={DollarSign} label="Total Revenue" value={`$${totalAmount.toFixed(2)}`} sub={`${total._count} transactions`} color="text-primary bg-primary/10" />
        <RevCard icon={TrendingUp} label="MRR (Last 30d)" value={`$${mrr.toFixed(2)}`} sub={`ARR: $${arr.toFixed(0)}`} color="text-success bg-success/10" />
        <RevCard icon={Crown} label="Last 7 Days" value={`$${(last7Total._sum.amount ?? 0).toFixed(2)}`} sub="weekly revenue" color="text-accent bg-accent/10" />
        <RevCard icon={AlertCircle} label="Failed Payments" value={failed.toString()} sub="needs review" color="text-danger bg-danger/10" />
      </div>

      {/* Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-text-primary mb-4">Revenue Sources</h2>
          <div className="space-y-3">
            <Row label="Subscriptions" amount={subsTotal._sum.amount ?? 0} total={totalAmount} color="bg-primary" />
            <Row label="Credit Packs" amount={creditsTotal._sum.amount ?? 0} total={totalAmount} color="bg-accent" />
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-text-primary mb-4">Paying Customers by Plan</h2>
          {byPlan.length === 0 ? (
            <p className="text-sm text-text-secondary">No paying customers yet</p>
          ) : (
            <div className="space-y-3">
              {byPlan.map((p) => (
                <div key={p.plan} className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-primary">{p.plan}</span>
                  <span className="text-sm text-text-secondary">{p._count} customers</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/5 p-4">
          <h2 className="font-heading text-lg font-bold text-text-primary">Recent Transactions</h2>
          <Link href="/admin/finance" className="text-xs font-semibold text-primary hover:underline">
            Full ledger →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">User</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Provider</th>
                <th className="text-right px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-secondary">
                    <CreditCard className="mx-auto h-10 w-10 mb-2 opacity-30" />
                    No transactions yet
                  </td>
                </tr>
              ) : transactions.map((t) => (
                <tr key={t.id} className="border-t border-black/5 hover:bg-bg-secondary/30">
                  <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {t.user ? (
                      <Link href={`/admin/users/${t.user.id}`} className="text-sm font-semibold text-text-primary hover:text-primary">
                        {t.user.name ?? t.user.email ?? "—"}
                      </Link>
                    ) : <span className="text-text-secondary">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{t.type}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary uppercase">{t.provider}</td>
                  <td className="px-4 py-3 text-right font-bold text-success">${t.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      t.status === "completed" ? "bg-success/10 text-success"
                      : t.status === "failed" ? "bg-danger/10 text-danger"
                      : "bg-warning/10 text-warning"
                    }`}>
                      {t.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RevCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-heading text-2xl font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-secondary">{label}</div>
      <div className="mt-1 text-[10px] text-text-secondary">{sub}</div>
    </div>
  );
}

function Row({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-text-primary">{label}</span>
        <span className="text-text-secondary">${amount.toFixed(2)} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
