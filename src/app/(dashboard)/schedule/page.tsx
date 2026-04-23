import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, Plus, Clock, Video, CheckCircle2 } from "lucide-react";
import { ScheduleClient } from "./ScheduleClient";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const ads = await prisma.ad.findMany({
    where: {
      userId: session.user.id,
      scheduledAt: { not: null },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary">Posting Schedule</h1>
          <p className="text-text-secondary">Your upcoming automated social media posts</p>
        </div>
        <Link
          href="/create"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-all shadow-md shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          Schedule New
        </Link>
      </div>

      {ads.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-black/5 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-secondary text-text-secondary">
            <Calendar className="h-8 w-8" />
          </div>
          <h2 className="font-heading text-xl font-bold text-text-primary mb-2">Your schedule is empty</h2>
          <p className="text-text-secondary mb-6 max-w-sm mx-auto">
            AI-powered scheduling ensures your ads hit the feed when your audience is most active.
          </p>
          <Link
            href="/create"
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Create and schedule an ad
          </Link>
        </div>
      ) : (
        <ScheduleClient initialAds={JSON.parse(JSON.stringify(ads))} />
      )}
    </div>
  );
}
