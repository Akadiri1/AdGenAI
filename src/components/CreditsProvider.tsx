"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Ctx = {
  credits: number;
  setCredits: (n: number) => void;
  refreshCredits: () => Promise<number | void>;
};

const CreditsCtx = createContext<Ctx | null>(null);

export function useCredits(): Ctx {
  const ctx = useContext(CreditsCtx);
  if (!ctx) throw new Error("useCredits must be inside <CreditsProvider>");
  return ctx;
}

export function CreditsProvider({
  initialCredits,
  children,
}: {
  initialCredits: number;
  children: ReactNode;
}) {
  const [credits, setCredits] = useState(initialCredits);

  const refreshCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/credits");
      const data = await res.json();
      if (data.credits !== undefined) {
        setCredits(data.credits);
        return data.credits as number;
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <CreditsCtx.Provider value={{ credits, setCredits, refreshCredits }}>
      {children}
    </CreditsCtx.Provider>
  );
}
