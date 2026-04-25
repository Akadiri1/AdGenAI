"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, DollarSign, Receipt, Film, Activity,
  Server, Map, MoreHorizontal, X, LogOut, ShieldCheck,
} from "lucide-react";

const PRIMARY_TABS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
  { href: "/admin/ads", label: "Ads", icon: Film },
];

const MORE_ITEMS = [
  { href: "/admin/finance", label: "Finance & API Costs", icon: Receipt },
  { href: "/admin/infrastructure", label: "Infrastructure", icon: Server },
  { href: "/admin/activity", label: "Activity log", icon: Activity },
  { href: "/admin/sitemap", label: "Sitemap (all pages)", icon: Map },
];

/**
 * Admin bottom navigation — visible across ALL screen sizes (no sidebar).
 * Mirrors the user dashboard's BottomNav pattern: 4 primary tabs + a More drawer.
 */
export function AdminBottomNav({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-[100] safe-bottom">
        <div className="mx-auto max-w-2xl mx-2 sm:mx-auto mb-1 rounded-2xl border border-black/5 bg-white/90 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-around px-1 py-2">
            {PRIMARY_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href, tab.exact);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex flex-col items-center min-w-[56px] flex-1"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-all ${
                    active ? "bg-danger text-white shadow-md shadow-danger/30" : "text-text-secondary"
                  }`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <span className={`mt-0.5 text-[9px] font-semibold leading-none ${active ? "text-danger" : "text-text-secondary"}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
            <button
              onClick={() => setShowMore(true)}
              className="flex flex-col items-center min-w-[56px] flex-1"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-all ${
                showMore ? "bg-danger text-white shadow-md" : "text-text-secondary"
              }`}>
                <MoreHorizontal className="h-[18px] w-[18px]" />
              </div>
              <span className={`mt-0.5 text-[9px] font-semibold leading-none ${showMore ? "text-danger" : "text-text-secondary"}`}>
                More
              </span>
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-[201] mx-auto max-w-2xl mx-2 sm:mx-auto mb-2 rounded-3xl border border-black/10 bg-white/95 backdrop-blur-2xl shadow-2xl"
              style={{ maxHeight: "70vh" }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-black/15" />
              </div>

              <div className="flex items-center justify-between px-5 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-danger" />
                  <h3 className="font-heading text-lg font-bold text-text-primary">Admin · More</h3>
                </div>
                <button
                  onClick={() => setShowMore(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 hover:bg-black/10"
                >
                  <X className="h-4 w-4 text-text-primary" />
                </button>
              </div>

              <div className="overflow-y-auto px-4 pb-6" style={{ maxHeight: "calc(70vh - 80px)" }}>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {MORE_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowMore(false)}
                        className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all ${
                          active
                            ? "bg-danger/15 text-danger"
                            : "text-text-secondary hover:bg-black/5 hover:text-text-primary"
                        }`}
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          active ? "bg-danger/20" : "bg-bg-secondary"
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-semibold text-center leading-tight">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Logged-in identity */}
                <div className="mt-4 rounded-2xl bg-bg-secondary p-3 text-xs">
                  <div className="text-text-secondary mb-0.5">Logged in as</div>
                  <div className="font-semibold text-text-primary truncate">{adminEmail}</div>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setShowMore(false)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-black/10 bg-white py-3 text-sm font-semibold text-text-primary hover:bg-bg-secondary transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Exit admin → user dashboard
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
