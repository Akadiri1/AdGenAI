"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLang } from "@/components/LangProvider";
import { useCredits } from "@/components/CreditsProvider";
import { PWAInstallButton } from "@/components/PWAInstall";
import { Logo } from "@/components/Logo";

type Props = {
  plan?: string;
  userName?: string;
};

export function Topbar({ plan = "FREE", userName = "User" }: Props) {
  const { t } = useLang();
  const { credits } = useCredits();

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-black/5 bg-white/80 px-4 sm:px-6 backdrop-blur-lg">
      <div className="flex items-center gap-3">
        {/* Show logo on mobile (since sidebar is hidden) */}
        <div className="md:hidden">
          <Link href="/dashboard">
            <Logo size="sm" withText={false} />
          </Link>
        </div>
        <h1 className="font-heading text-sm sm:text-lg font-bold text-text-primary truncate max-w-[160px] sm:max-w-none">
          <span className="hidden sm:inline">{t("topbar.welcome")}, </span>{userName} 👋
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <PWAInstallButton />
        <ThemeToggle />
        <div className="flex items-center gap-1.5 rounded-xl bg-bg-secondary px-2.5 py-1.5 sm:px-3 sm:py-2">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-text-secondary hidden sm:block">
            {t("topbar.credits")}
          </span>
          <span className="font-heading text-xs sm:text-sm font-bold text-text-primary">{credits}</span>
        </div>
        <Link
          href="/settings/billing"
          className="hidden rounded-xl bg-gradient-to-r from-primary to-warning px-3 py-2 text-xs font-bold text-white sm:block"
        >
          {plan}
        </Link>
        {plan === "FREE" && (
          <Link
            href="/settings/billing"
            className="hidden sm:block rounded-xl border-2 border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            {t("topbar.upgrade")}
          </Link>
        )}
      </div>
    </header>
  );
}
