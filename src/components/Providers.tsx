"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmModal";
import { LangProvider } from "@/components/LangProvider";
import type { LangCode } from "@/lib/i18n";

export function Providers({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode;
  initialLang?: LangCode;
}) {
  return (
    <SessionProvider>
      <LangProvider initialLang={initialLang}>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </LangProvider>
    </SessionProvider>
  );
}
