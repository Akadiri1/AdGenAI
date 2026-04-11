import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Users, DollarSign, Film, TrendingUp, Crown, AlertCircle,
  CheckCircle2, ArrowUpRight, Activity,
} from "lucide-react";
import { AdminCharts } from "./AdminCharts";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const last7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const last24h = new Date(now.getTime() - 24 * 3600 * 1000);

  const [
    totalUsers,
    newUsersLast30,
    newUsersLast7,
    newUsersLast24h,
    usersByPlan,
    totalAds,
    adsLast30,
    totalRevenue,
    revenueLast30,
    failedPayments,
    suspendedUsers,
    activeSubscriptions,
    recentSignups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: last30 } } }),
    prisma.user.count({ where: { createdAt: { gte: last7 } } }),
    prisma.user.count({ where: { createdAt: { gte: last24h } } }),
    prisma.user.groupBy({ by: ["plan"], _count: true }),
    prisma.ad.count(),
    prisma.ad.count({ where: { createdAt: { gte: last30 } } }),
    prisma.transaction.aggregate({
      where: { type: "subscription", status: "completed" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "subscription", status: "completed", createdAt: { gte: last30 } },
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where: { status: "failed" } }),
    prisma.user.count({ where: { isSuspended: true } }),
    prisma.user.count({ where: { plan: { in: ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"] } } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, email: true, name: true, plan: true, createdAt: true, businessName: true },
    }),
  ]);

  const planMap: Record<string, number> = {};
  usersByPlan.forEach((p) => { planMap[p.plan] = p._count; });

  const mrr = (revenueLast30._sum.amount ?? 0);
  const arr = mrr * 12;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Platform Overview</h1>
        <p className="text-text-secondary text-sm">Real-time metrics across Famousli</p>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Total Users"
          value={totalUsers.toLocaleString()}
          sub={`+${newUsersLast30} last 30d`}
          color="text-primary bg-primary/10"
        />
        <MetricCard
          icon={Crown}
          label="Paying Customers"
          value={activeSubscriptions.toLocaleString()}
          sub={`${totalUsers > 0 ? ((activeSubscriptions / totalUsers) * 100).toFixed(1) : 0}% conversion`}
          color="text-success bg-success/10"
        />
        <MetricCard
          icon={DollarSign}
          label="MRR (Last 30d)"
          value={`$${mrr.toFixed(0)}`}
          sub={`ARR: $${arr.toFixed(0)}`}
          color="text-accent bg-accent/10"
        />
        <MetricCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${(totalRevenue._sum.amount ?? 0).toFixed(0)}`}
          sub="all time"
          color="text-warning bg-warning/10"
        />
      </div>

      {/* Growth metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={TrendingUp}
          label="Signups (24h)"
          value={newUsersLast24h.toString()}
          sub={`${newUsersLast7} this week`}
          color="text-primary bg-primary/10"
        />
        <MetricCard
          icon={Film}
          label="Total Ads Created"
          value={totalAds.toLocaleString()}
          sub={`+${adsLast30} last 30d`}
          color="text-accent bg-accent/10"
        />
        <MetricCard
          icon={AlertCircle}
          label="Failed Payments"
          value={failedPayments.toString()}
          sub="needs review"
          color="text-danger bg-danger/10"
        />
        <MetricCard
          icon={AlertCircle}
          label="Suspended"
          value={suspendedUsers.toString()}
          sub="users"
          color="text-warning bg-warning/10"
        />
      </div>

      <AdminCharts />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Plan distribution */}
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-text-primary mb-4">Plan Distribution</h2>
          <div className="space-y-3">
            {["FREE", "STARTER", "PRO", "BUSINESS", "ENTERPRISE"].map((plan) => {
              const count = planMap[plan] ?? 0;
              const pct = totalUsers > 0 ? (count / totalUsers) * 100 : 0;
              const color = plan === "FREE" ? "bg-gray-400"
                : plan === "STARTER" ? "bg-accent"
                : plan === "PRO" ? "bg-primary"
                : plan === "BUSINESS" ? "bg-warning"
                : "bg-secondary";
              return (
                <div key={plan}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-text-primary">{plan}</span>
                    <span className="text-text-secondary">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-bg-secondary overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent signups */}
        <div className="lg:col-span-2 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold text-text-primary">Recent Signups</h2>
            <Link href="/admin/users" className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentSignups.length === 0 ? (
              <p className="text-sm text-text-secondary py-6 text-center">No users yet</p>
            ) : recentSignups.map((u) => (
              <Link key={u.id} href={`/admin/users/${u.id}`}
                className="flex items-center justify-between rounded-xl border border-black/5 p-3 hover:bg-bg-secondary transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text-primary truncate">
                    {u.name ?? u.businessName ?? u.email ?? "Anonymous"}
                  </div>
                  <div className="text-xs text-text-secondary truncate">{u.email}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    u.plan === "FREE" ? "bg-gray-100 text-gray-700"
                    : "bg-success/10 text-success"
                  }`}>
                    {u.plan}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/admin/activity" className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 hover:shadow-md transition-shadow">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-semibold text-text-primary">Activity Log</div>
            <div className="text-xs text-text-secondary">Live audit trail</div>
          </div>
        </Link>
        <Link href="/admin/revenue" className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 hover:shadow-md transition-shadow">
          <DollarSign className="h-5 w-5 text-accent" />
          <div>
            <div className="text-sm font-semibold text-text-primary">Revenue Details</div>
            <div className="text-xs text-text-secondary">All transactions</div>
          </div>
        </Link>
        <Link href="/admin/users" className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 hover:shadow-md transition-shadow">
          <Users className="h-5 w-5 text-warning" />
          <div>
            <div className="text-sm font-semibold text-text-primary">Manage Users</div>
            <div className="text-xs text-text-secondary">Suspend, refund, impersonate</div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-heading text-2xl font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-secondary">{label}</div>
      {sub && <div className="mt-1 text-[10px] text-text-secondary">{sub}</div>}
    </div>
  );
}
