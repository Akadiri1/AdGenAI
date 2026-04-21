import { requireAdmin } from "@/lib/adminAuth";
import Link from "next/link";
import {
  LayoutDashboard, Users, DollarSign, Film, Activity,
  LogOut, ShieldCheck, Receipt, Server,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { AdminMobileNav } from "./AdminMobileNav";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/finance", label: "Finance & API Costs", icon: Receipt },
  { href: "/admin/infrastructure", label: "Infrastructure", icon: Server },
  { href: "/admin/ads", label: "Ads", icon: Film },
  { href: "/admin/activity", label: "Activity", icon: Activity },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="flex h-screen overflow-hidden bg-bg-secondary/20">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-black/5 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-black/5 px-6">
          <Logo size="md" />
          <span className="ml-1 rounded-md bg-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-danger">
            Admin
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-black/5 p-4 space-y-1">
          <div className="rounded-xl bg-bg-secondary p-3 mb-2">
            <div className="flex items-center gap-2 text-xs text-text-secondary mb-0.5">
              <ShieldCheck className="h-3 w-3 text-success" /> Logged in as
            </div>
            <div className="text-sm font-semibold text-text-primary truncate">{admin.email}</div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-secondary"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Exit admin
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-bg-dark/80 px-3 sm:px-6 backdrop-blur-lg">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <AdminMobileNav adminEmail={admin.email} />
            <h1 className="font-heading text-base sm:text-lg font-bold text-text-primary dark:text-white flex items-center gap-2 truncate">
              <ShieldCheck className="h-5 w-5 text-danger flex-shrink-0" />
              <span className="truncate">Super Admin</span>
            </h1>
          </div>
          <div className="text-[10px] sm:text-xs text-text-secondary flex-shrink-0">
            <Link
              href="/dashboard"
              className="md:hidden inline-flex items-center gap-1 rounded-lg border border-black/10 px-2 py-1 font-semibold hover:bg-bg-secondary"
            >
              Exit
            </Link>
            <span className="hidden md:inline">{new Date().toLocaleString()}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
