"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useLang } from "@/components/LangProvider";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Sparkles, Film, Megaphone, CalendarDays, BarChart3,
  Palette, Link2, Gift, Settings, Plus, HelpCircle, LogOut,
} from "lucide-react";

const navItems = [
  { labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "nav.createAd", href: "/create", icon: Sparkles },
  { labelKey: "nav.myAds", href: "/ads", icon: Film },
  // Hidden until they have content / are wired to ecommerce flow:
  // { labelKey: "nav.campaigns", href: "/campaigns", icon: Megaphone },
  // { labelKey: "nav.schedule", href: "/schedule", icon: CalendarDays },
  // { labelKey: "nav.analytics", href: "/analytics", icon: BarChart3 },
  // { labelKey: "nav.templates", href: "/templates", icon: Palette },
  // { labelKey: "nav.marketplace", href: "/marketplace", icon: ShoppingBag },
  // { labelKey: "nav.connect", href: "/connect", icon: Link2 },
  { labelKey: "nav.referrals", href: "/referral", icon: Gift },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLang();

  return (
    <aside className="hidden w-64 flex-col border-r border-black/5 dark:border-white/10 bg-white dark:bg-bg-dark md:flex">
      <div className="flex h-16 items-center border-b border-black/5 dark:border-white/10 px-6">
        <Link href="/dashboard">
          <Logo size="md" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <Link
          href="/create"
          className="mb-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-md shadow-primary/30 transition-all hover:bg-primary-dark hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          {t("nav.newAd")}
        </Link>

        <ul className="space-y-1">
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

      <div className="border-t border-black/5 dark:border-white/10 p-4 space-y-1">
        <Link
          href="/onboarding"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
        >
          <HelpCircle className="h-[18px] w-[18px]" />
          How it works
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
        >
          <Settings className="h-[18px] w-[18px]" />
          {t("nav.settings")}
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
