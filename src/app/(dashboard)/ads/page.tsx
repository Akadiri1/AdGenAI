import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdCard } from "@/components/ads/AdPreview";
import { stringToPlatforms } from "@/lib/adHelpers";
import { Film } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

  const rawAds = session?.user?.id
    ? await prisma.ad.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  const ads = rawAds.map((a) => ({ ...a, platform: stringToPlatforms(a.platform) }));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary">My Ads</h1>
          <p className="text-text-secondary">{ads.length} ad{ads.length !== 1 && "s"} total</p>
        </div>
        <Link
          href="/create/magic"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary-dark transition-colors"
        >
          ✨ New ad
        </Link>
      </div>

      {params.created && (
        <div className="mb-6 rounded-2xl border border-success/20 bg-success/10 p-4 text-sm text-success font-semibold">
          ✅ Successfully generated {params.created} ad variant{Number(params.created) !== 1 && "s"}
        </div>
      )}

      {ads.length === 0 ? (
        <div className="rounded-3xl border border-black/5 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-secondary">
            <Film className="h-8 w-8 text-text-secondary" />
          </div>
          <h2 className="font-heading text-xl font-bold text-text-primary mb-2">No ads yet</h2>
          <p className="text-text-secondary mb-6">Create your first ad in 30 seconds with Magic Mode</p>
          <Link
            href="/create/magic"
            className="inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            ✨ Create first ad
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ads.map((ad) => (
            <Link key={ad.id} href={`/ads/${ad.id}`}>
              <AdCard ad={ad} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
