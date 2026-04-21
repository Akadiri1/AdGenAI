"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, DollarSign, Receipt, Film, Activity,
  ShieldCheck, LogOut, Menu, X, Server,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/finance", label: "Finance & API Costs", icon: Receipt },
  { href: "/admin/infrastructure", label: "Infrastructure", icon: Server },
  { href: "/admin/ads", label: "Ads", icon: Film },
  { href: "/admin/activity", label: "Activity", icon: Activity },
];

/**
 * Mobile navigation for the admin dashboard.
 * Shows a hamburger button in the header; tapping opens a full-height drawer
 * with the same nav items as the desktop sidebar.
 */
export function AdminMobileNav({ adminEmail }: { adminEmail: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Trigger — only visible on mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-text-primary hover:bg-bg-secondary"
        aria-label="Open admin menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[140] bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-[141] h-full w-72 max-w-[85vw] flex flex-col border-r border-black/5 bg-white shadow-2xl md:hidden">
            {/* Drawer header */}
            <div className="flex h-14 items-center justify-between border-b border-black/5 px-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-danger" />
                <span className="font-heading font-bold text-text-primary">Admin</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary hover:bg-bg-secondary"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-1">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer — admin info + exit */}
            <div className="border-t border-black/5 p-4 space-y-2">
              {adminEmail && (
                <div className="rounded-xl bg-bg-secondary p-3">
                  <div className="flex items-center gap-2 text-xs text-text-secondary mb-0.5">
                    <ShieldCheck className="h-3 w-3 text-success" /> Logged in as
                  </div>
                  <div className="text-sm font-semibold text-text-primary truncate">{adminEmail}</div>
                </div>
              )}
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-text-secondary hover:bg-bg-secondary"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Exit admin
              </Link>
            </div>
          </aside>
        </>
      )}
    </>
  );
}