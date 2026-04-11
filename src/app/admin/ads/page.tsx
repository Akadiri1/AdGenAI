import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Film, Image as ImageIcon, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAdsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const where: Record<string, unknown> = {};
  if (params.q) {
    where.OR = [
      { headline: { contains: params.q, mode: "insensitive" } },
      { bodyText: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.type) where.type = params.type;
  if (params.status) where.status = params.status;

  const [ads, totalAds, byType, byStatus] = await Promise.all([
    prisma.ad.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, email: true, name: true } } },
    }),
    prisma.ad.count(),
    prisma.ad.groupBy({ by: ["type"], _count: true }),
    prisma.ad.groupBy({ by: ["status"], _count: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Ads</h1>
        <p className="text-text-secondary text-sm">{totalAds.toLocaleString()} ads created across the platform</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Ads" value={totalAds.toString()} />
        {byType.slice(0, 3).map((t) => (
          <Stat key={t.type} label={t.type} value={t._count.toString()} />
        ))}
      </div>

      {/* Status breakdown */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-text-primary mb-4">By Status</h2>
        <div className="flex flex-wrap gap-2">
          {byStatus.map((s) => (
            <div key={s.status} className="rounded-xl bg-bg-secondary px-4 py-2">
              <div className="text-xs text-text-secondary">{s.status}</div>
              <div className="font-bold text-text-primary">{s._count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <form className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              type="text" name="q" defaultValue={params.q ?? ""}
              placeholder="Search by headline or copy..."
              className="w-full rounded-xl border-2 border-black/10 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <select name="type" defaultValue={params.type ?? ""}
            className="rounded-xl border-2 border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary">
            <option value="">All types</option>
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
            <option value="CAROUSEL">Carousel</option>
            <option value="STORY">Story</option>
            <option value="REEL">Reel</option>
          </select>
          <select name="status" defaultValue={params.status ?? ""}
            className="rounded-xl border-2 border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary">
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="GENERATING">Generating</option>
            <option value="READY">Ready</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="POSTED">Posted</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        <button type="submit" className="mt-3 h-9 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark">
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Preview</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Headline</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">User</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Created</th>
              </tr>
            </thead>
            <tbody>
              {ads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-secondary">
                    <Film className="mx-auto h-10 w-10 mb-2 opacity-30" />
                    No ads match your filters
                  </td>
                </tr>
              ) : ads.map((ad) => (
                <tr key={ad.id} className="border-t border-black/5 hover:bg-bg-secondary/30">
                  <td className="px-4 py-3">
                    {ad.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ad.thumbnailUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-bg-secondary flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-text-secondary" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[280px]">
                    <div className="font-semibold text-text-primary truncate">{ad.headline ?? "Untitled"}</div>
                    <div className="text-xs text-text-secondary truncate">{ad.callToAction ?? ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    {ad.user ? (
                      <Link href={`/admin/users/${ad.user.id}`} className="text-sm text-text-primary hover:text-primary">
                        {ad.user.name ?? ad.user.email ?? "—"}
                      </Link>
                    ) : <span className="text-text-secondary">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {ad.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      ad.status === "READY" || ad.status === "POSTED" ? "bg-success/10 text-success"
                      : ad.status === "FAILED" ? "bg-danger/10 text-danger"
                      : ad.status === "GENERATING" ? "bg-warning/10 text-warning"
                      : "bg-bg-secondary text-text-secondary"
                    }`}>
                      {ad.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                    {new Date(ad.createdAt).toLocaleDateString()}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="font-heading text-2xl font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-secondary">{label}</div>
    </div>
  );
}
