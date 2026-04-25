"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { useLang } from "@/components/LangProvider";
import {
  LayoutDashboard, Sparkles, Film, Megaphone, CalendarDays, BarChart3,
  Palette, Link2, Gift, Settings, Plus, Menu, X, HelpCircle,
} from "lucide-react";

const navItems = [
  { labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "nav.createAd", href: "/create", icon: Sparkles },
  { labelKey: "nav.myAds", href: "/ads", icon: Film },
  // Hidden until ready:
  // { labelKey: "nav.campaigns", href: "/campaigns", icon: Megaphone },
  // { labelKey: "nav.schedule", href: "/schedule", icon: CalendarDays },
  // { labelKey: "nav.analytics", href: "/analytics", icon: BarChart3 },
  // { labelKey: "nav.templates", href: "/templates", icon: Palette },
  // { labelKey: "nav.marketplace", href: "/marketplace", icon: ShoppingBag },
  // { labelKey: "nav.connect", href: "/connect", icon: Link2 },
  { labelKey: "nav.referrals", href: "/referral", icon: Gift },
];

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white hover:bg-bg-secondary transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-text-primary" />
      </button>

      {/* Overlay + drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed left-0 top-0 bottom-0 z-[301] w-72 bg-white shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex h-16 items-center justify-between border-b border-black/5 px-5">
                <Logo size="md" />
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-secondary hover:bg-black/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* New Ad button */}
              <div className="p-4">
                <Link
                  href="/create"
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-md shadow-primary/30 hover:bg-primary-dark"
                >
                  <Plus className="h-4 w-4" />
                  {t("nav.newAd")}
                </Link>
              </div>

              {/* Nav items */}
              <nav className="flex-1 overflow-y-auto px-3">
                <ul className="space-y-0.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active =
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                          }`}
                        >
                          <Icon className="h-[18px] w-[18px]" />
                          {t(item.labelKey)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Footer */}
              <div className="border-t border-black/5 p-3 space-y-0.5">
                <Link
                  href="/onboarding"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                >
                  <HelpCircle className="h-[18px] w-[18px]" /> How it works
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                >
                  <Settings className="h-[18px] w-[18px]" /> {t("nav.settings")}
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
