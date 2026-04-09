"use client";

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { t as translate, type LangCode, isRTL } from "@/lib/i18n";

type Ctx = {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string) => string;
};

const LangCtx = createContext<Ctx | null>(null);

export function useLang(): Ctx {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}

export function LangProvider({
  initialLang = "en",
  children,
}: {
  initialLang?: LangCode;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<LangCode>(initialLang);

  // Apply lang + dir to <html> whenever it changes
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL(lang) ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
      document.cookie = `lang=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
    } catch {}
  }, []);

  const t = useCallback((key: string) => translate(lang, key), [lang]);

  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}
