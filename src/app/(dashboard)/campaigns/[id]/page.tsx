import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { CampaignActions } from "./CampaignActions";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-text-secondary">Please log in</p>
        <Link href="/auth/login" className="text-primary font-semibold">Log in</Link>
      </div>
    );
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { ads: { orderBy: { createdAt: "desc" } } },
  });
  if (!campaign || campaign.userId !== session.user.id) notFound();

  const totals = campaign.ads.reduce(
    (acc, a) => ({
      impressions: acc.impressions + a.impressions,
      clicks: acc.clicks + a.clicks,
      conversions: acc.conversions + a.conversions,
      spend: acc.spend + a.spend,
      revenue: acc.revenue + a.revenue,
    }),
    { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 },
  );

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/campaigns"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Campaigns
      </Link>

      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary">{campaign.name}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-text-secondary">
            <span className="rounded-md bg-bg-secondary px-2 py-0.5 text-xs font-semibold capitalize">{campaign.status}</span>
            {campaign.objective && <span className="capitalize">{campaign.objective}</span>}
            {campaign.budget && <span>Budget: ${campaign.budget.toLocaleString()}</span>}
          </div>
        </div>
      </div>

      <CampaignActions
        campaign={{
          id: campaign.id,
          name: campaign.name,
          objective: campaign.objective,
          budget: campaign.budget,
          status: campaign.status,
        }}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Ads" value={campaign.ads.length.toString()} />
        <Stat label="Impressions" value={totals.impressions.toLocaleString()} />
        <Stat label="Clicks" value={totals.clicks.toLocaleString()} />
        <Stat label="Spend" value={`$${totals.spend.toFixed(0)}`} />
        <Stat label="Revenue" value={`$${totals.revenue.toFixed(0)}`} />
      </div>

      <h2 className="font-heading text-lg font-bold text-text-primary mb-3">Ads in this campaign</h2>
      {campaign.ads.length === 0 ? (
        <div className="rounded-3xl border border-black/5 bg-white p-12 text-center">
          <p className="text-text-secondary mb-4">No ads in this campaign yet</p>
          <Link
            href="/create/magic"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Create an ad
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {campaign.ads.map((ad) => (
            <Link
              key={ad.id}
              href={`/ads/${ad.id}`}
              className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="aspect-square bg-bg-secondary">
                {ad.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ad.thumbnailUrl} alt={ad.headline ?? ""} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-3">
                <div className="line-clamp-1 text-sm font-semibold text-text-primary">
                  {ad.headline ?? "Untitled"}
                </div>
                <div className="text-xs text-text-secondary">{ad.status}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">{label}</div>
      <div className="font-heading text-xl font-bold text-text-primary">{value}</div>
    </div>
  );
}
