"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Sparkles, Film, BarChart3, MoreHorizontal,
  Megaphone, CalendarDays, Palette, ShoppingBag, Link2,
  Gift, Settings, HelpCircle, X, CreditCard, Paintbrush, User,
} from "lucide-react";

const PRIMARY_TABS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/create", icon: Sparkles, label: "Create" },
  { href: "/ads", icon: Film, label: "My Ads" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
];

const MORE_ITEMS = [
  { href: "/campaigns", icon: Megaphone, label: "Campaigns" },
  { href: "/schedule", icon: CalendarDays, label: "Schedule" },
  { href: "/templates", icon: Palette, label: "Templates" },
  { href: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
  { href: "/connect", icon: Link2, label: "Connect" },
  { href: "/referral", icon: Gift, label: "Referrals" },
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/settings/account", icon: User, label: "Account" },
  { href: "/settings/billing", icon: CreditCard, label: "Billing" },
  { href: "/settings/brand", icon: Paintbrush, label: "Brand Kit" },
  { href: "/onboarding", icon: HelpCircle, label: "How it works" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* Bottom tab bar — rounded top corners */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden safe-bottom">
        <div className="mx-2 mb-1 rounded-2xl border border-black/5 bg-white/90 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-around px-1 py-2">
            {PRIMARY_TABS.map((tab) => {
              const Icon = tab.icon;
              const active =
                tab.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex flex-col items-center min-w-[56px]"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-all ${
                    active ? "bg-primary text-white shadow-md shadow-primary/30" : "text-text-secondary"
                  }`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <span className={`mt-0.5 text-[9px] font-semibold leading-none ${active ? "text-primary" : "text-text-secondary"}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
            <button
              onClick={() => setShowMore(true)}
              className="flex flex-col items-center min-w-[56px]"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-all ${
                showMore ? "bg-primary text-white shadow-md" : "text-text-secondary"
              }`}>
                <MoreHorizontal className="h-[18px] w-[18px]" />
              </div>
              <span className={`mt-0.5 text-[9px] font-semibold leading-none ${showMore ? "text-primary" : "text-text-secondary"}`}>
                More
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Glass modal for "More" */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-[201] mx-2 mb-2 rounded-3xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#1e1e36]/95 backdrop-blur-2xl shadow-2xl md:hidden"
              style={{ maxHeight: "70vh" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-black/15 dark:bg-white/20" />
              </div>

              <div className="flex items-center justify-between px-5 pb-3">
                <h3 className="font-heading text-lg font-bold text-text-primary">More</h3>
                <button
                  onClick={() => setShowMore(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                >
                  <X className="h-4 w-4 text-text-primary" />
                </button>
              </div>

              <div className="overflow-y-auto px-4 pb-6" style={{ maxHeight: "calc(70vh - 70px)" }}>
                <div className="grid grid-cols-4 gap-2">
                  {MORE_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowMore(false)}
                        className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 transition-all ${
                          active
                            ? "bg-primary/15 text-primary"
                            : "text-text-secondary hover:bg-black/5 dark:hover:bg-white/10 hover:text-text-primary"
                        }`}
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          active ? "bg-primary/20" : "bg-bg-secondary dark:bg-white/10"
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-semibold text-center leading-tight">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
