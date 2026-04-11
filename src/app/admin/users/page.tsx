import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, Users as UsersIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; status?: string }>;
}) {
  const params = await searchParams;
  const where: Record<string, unknown> = {};
  if (params.q) {
    where.OR = [
      { email: { contains: params.q, mode: "insensitive" } },
      { name: { contains: params.q, mode: "insensitive" } },
      { businessName: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.plan) where.plan = params.plan;
  if (params.status === "suspended") where.isSuspended = true;
  if (params.status === "admin") where.isAdmin = true;

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: { select: { ads: true, transactions: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Users</h1>
        <p className="text-text-secondary text-sm">{users.length} of {users.length}+ users</p>
      </div>

      {/* Filters */}
      <form className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search by email, name, business..."
              className="w-full rounded-xl border-2 border-black/10 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <select name="plan" defaultValue={params.plan ?? ""}
            className="rounded-xl border-2 border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary">
            <option value="">All plans</option>
            <option value="FREE">Free</option>
            <option value="STARTER">Starter</option>
            <option value="PRO">Pro</option>
            <option value="BUSINESS">Business</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          <select name="status" defaultValue={params.status ?? ""}
            className="rounded-xl border-2 border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary">
            <option value="">All statuses</option>
            <option value="suspended">Suspended</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <button type="submit" className="mt-3 h-9 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark">
          Filter
        </button>
      </form>

      <div className="rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">User</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Plan</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Credits</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Ads</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Joined</th>
                <th className="text-left px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-secondary">
                    <UsersIcon className="mx-auto h-10 w-10 mb-2 opacity-30" />
                    No users match your filters
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-t border-black/5 hover:bg-bg-secondary/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${u.id}`} className="block">
                      <div className="font-semibold text-text-primary">
                        {u.name ?? u.businessName ?? "Anonymous"}
                      </div>
                      <div className="text-xs text-text-secondary">{u.email}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      u.plan === "FREE" ? "bg-gray-100 text-gray-700"
                      : u.plan === "STARTER" ? "bg-accent/10 text-accent"
                      : u.plan === "PRO" ? "bg-primary/10 text-primary"
                      : u.plan === "BUSINESS" ? "bg-warning/10 text-warning"
                      : "bg-secondary/10 text-secondary"
                    }`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-primary font-semibold">{u.credits}</td>
                  <td className="px-4 py-3 text-text-secondary">{u._count.ads}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {u.isSuspended ? (
                      <span className="rounded-md bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">SUSPENDED</span>
                    ) : u.isAdmin ? (
                      <span className="rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">ADMIN</span>
                    ) : (
                      <span className="rounded-md bg-bg-secondary px-2 py-0.5 text-[10px] font-bold text-text-secondary">ACTIVE</span>
                    )}
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
