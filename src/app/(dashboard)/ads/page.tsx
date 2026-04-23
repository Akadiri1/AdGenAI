import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Film, Plus, Calendar, Clock, CheckCircle2, ChevronRight, Filter, Search } from "lucide-react";
import { AdList } from "@/components/dashboard/AdList";

export const dynamic = "force-dynamic";

export default async function MyAdsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-text-secondary">Please log in to view your ads</p>
        <Link href="/auth/login" className="text-primary font-semibold">Log in</Link>
      </div>
    );
  }

  const ads = await prisma.ad.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary">My Ads</h1>
          <p className="text-text-secondary">Manage and track your AI-generated campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/create"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Create Ad
          </Link>
        </div>
      </div>

      {ads.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-black/5 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-secondary">
            <Film className="h-8 w-8 text-text-secondary" />
          </div>
          <h2 className="font-heading text-xl font-bold text-text-primary mb-2">No ads generated yet</h2>
          <p className="text-text-secondary mb-6 max-w-sm mx-auto">
            Ready to scale your business? Create your first high-converting AI ad in under 60 seconds.
          </p>
          <Link
            href="/create"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Create your first ad
          </Link>
        </div>
      ) : (
        <AdList initialAds={JSON.parse(JSON.stringify(ads))} />
      )}
    </div>
  );
}
