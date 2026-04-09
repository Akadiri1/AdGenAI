import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Megaphone, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-text-secondary">Please log in</p>
        <Link href="/auth/login" className="text-primary font-semibold">Log in</Link>
      </div>
    );
  }

  const campaigns = await prisma.campaign.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { ads: true } } },
  });

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary">Campaigns</h1>
          <p className="text-text-secondary">
            {campaigns.length} campaign{campaigns.length !== 1 && "s"}
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-md transition-all hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          New campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-3xl border border-black/5 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-secondary">
            <Megaphone className="h-8 w-8 text-text-secondary" />
          </div>
          <h2 className="font-heading text-xl font-bold text-text-primary mb-2">No campaigns yet</h2>
          <p className="text-text-secondary mb-6">
            Group related ads into campaigns to track budget, objective, and schedule together.
          </p>
          <Link
            href="/campaigns/new"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            Create first campaign
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/campaigns/${c.id}`}
              className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                    c.status === "active"
                      ? "bg-success/10 text-success"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {c.status}
                </span>
                <span className="text-xs text-text-secondary">{c._count.ads} ads</span>
              </div>
              <h3 className="font-heading font-bold text-text-primary mb-1 line-clamp-1">{c.name}</h3>
              {c.objective && (
                <p className="text-sm text-text-secondary capitalize">{c.objective}</p>
              )}
              {c.budget && (
                <div className="mt-3 text-xs text-text-secondary">
                  Budget: <strong className="text-text-primary">${c.budget.toLocaleString()}</strong>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
