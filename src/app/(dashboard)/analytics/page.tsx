import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AnalyticsClient } from "./AnalyticsClient";
import { stringToPlatforms } from "@/lib/adHelpers";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
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
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [ads, user] = await Promise.all([
    prisma.ad.findMany({
      where: { userId, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        headline: true,
        score: true,
        thumbnailUrl: true,
        impressions: true,
        clicks: true,
        conversions: true,
        spend: true,
        revenue: true,
        platform: true,
        createdAt: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true, country: true, plan: true },
    }),
  ]);

  const totals = ads.reduce(
    (acc, ad) => ({
      impressions: acc.impressions + ad.impressions,
      clicks: acc.clicks + ad.clicks,
      conversions: acc.conversions + ad.conversions,
      spend: acc.spend + ad.spend,
      revenue: acc.revenue + ad.revenue,
    }),
    { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 },
  );

  return (
    <AnalyticsClient
      ads={JSON.parse(JSON.stringify(
        ads.map((a) => ({ ...a, platform: stringToPlatforms(a.platform) }))
      ))}
      totals={totals}
      currency={user?.currency ?? "USD"}
      showFullAnalytics={["PRO", "BUSINESS", "ENTERPRISE"].includes(user?.plan ?? "FREE")}
    />
  );
}
