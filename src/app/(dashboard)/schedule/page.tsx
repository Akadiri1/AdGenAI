import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ScheduleCalendar } from "./ScheduleCalendar";
import { stringToPlatforms } from "@/lib/adHelpers";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-text-secondary">Please log in</p>
        <Link href="/auth/login" className="text-primary font-semibold">Log in</Link>
      </div>
    );
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  const scheduledAds = await prisma.ad.findMany({
    where: {
      userId: session.user.id,
      scheduledAt: { gte: monthStart, lte: monthEnd },
      status: { in: ["SCHEDULED", "POSTING", "POSTED"] },
    },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      headline: true,
      status: true,
      scheduledAt: true,
      platform: true,
      thumbnailUrl: true,
    },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary">Schedule</h1>
          <p className="text-text-secondary">{scheduledAds.length} post{scheduledAds.length !== 1 && "s"} scheduled</p>
        </div>
        <Link
          href="/create/magic"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          ✨ New ad
        </Link>
      </div>

      <ScheduleCalendar
        ads={JSON.parse(JSON.stringify(
          scheduledAds.map((a) => ({ ...a, platform: stringToPlatforms(a.platform) }))
        ))}
        startDate={now.toISOString()}
      />
    </div>
  );
}
