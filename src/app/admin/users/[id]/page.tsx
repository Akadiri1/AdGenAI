import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Calendar, CreditCard, Film, DollarSign } from "lucide-react";
import { UserActions } from "./UserActions";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: { select: { ads: true, transactions: true, campaigns: true } },
    },
  });

  if (!user) notFound();

  const [recentAds, recentTx, recentLogs] = await Promise.all([
    prisma.ad.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, headline: true, type: true, status: true, createdAt: true },
    }),
    prisma.transaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.auditLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  const totalSpent = await prisma.transaction.aggregate({
    where: { userId: id, status: "completed" },
    _sum: { amount: true },
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      {/* Header */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl font-bold text-text-primary">
              {user.name ?? user.businessName ?? "Anonymous"}
            </h1>
            <div className="mt-2 space-y-1 text-sm text-text-secondary">
              {user.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </div>
              )}
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> {user.phone}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" /> Joined {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                {user.plan}
              </span>
              {user.isAdmin && (
                <span className="rounded-md bg-success/10 px-2 py-1 text-xs font-bold text-success">ADMIN</span>
              )}
              {user.isSuspended && (
                <span className="rounded-md bg-danger/10 px-2 py-1 text-xs font-bold text-danger">SUSPENDED</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-black/5 pt-4">
          <UserActions
            userId={user.id}
            isSuspended={user.isSuspended}
            isAdmin={user.isAdmin}
            currentPlan={user.plan}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={CreditCard} label="Credits" value={user.credits.toString()} color="text-primary bg-primary/10" />
        <StatCard icon={Film} label="Ads Created" value={user._count.ads.toString()} color="text-accent bg-accent/10" />
        <StatCard icon={DollarSign} label="Total Spent" value={`$${(totalSpent._sum.amount ?? 0).toFixed(2)}`} color="text-success bg-success/10" />
        <StatCard icon={CreditCard} label="Transactions" value={user._count.transactions.toString()} color="text-warning bg-warning/10" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent ads */}
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-text-primary mb-4">Recent Ads</h2>
          {recentAds.length === 0 ? (
            <p className="text-sm text-text-secondary">No ads yet</p>
          ) : (
            <div className="space-y-2">
              {recentAds.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-black/5 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-text-primary truncate">
                      {a.headline ?? "Untitled"}
                    </div>
                    <div className="text-xs text-text-secondary">{a.type} • {a.status}</div>
                  </div>
                  <div className="text-xs text-text-secondary flex-shrink-0">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-text-primary mb-4">Recent Transactions</h2>
          {recentTx.length === 0 ? (
            <p className="text-sm text-text-secondary">No transactions</p>
          ) : (
            <div className="space-y-2">
              {recentTx.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl border border-black/5 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-text-primary truncate">{t.type}</div>
                    <div className="text-xs text-text-secondary">{t.status}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-text-primary">${t.amount.toFixed(2)}</div>
                    <div className="text-xs text-text-secondary">{new Date(t.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity log */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-text-primary mb-4">Activity Log</h2>
        {recentLogs.length === 0 ? (
          <p className="text-sm text-text-secondary">No activity recorded</p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-xl border border-black/5 p-3 text-xs">
                <div className="font-semibold text-text-primary">{l.action}</div>
                <div className="text-text-secondary">{new Date(l.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; color: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-heading text-2xl font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-secondary">{label}</div>
    </div>
  );
}
