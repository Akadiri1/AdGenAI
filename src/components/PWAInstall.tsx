"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  }

  // Don't show if already installed or no prompt available
  if (installed || !deferredPrompt) return null;

  return (
    <button
      onClick={install}
      className="flex h-9 items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-2.5 text-[10px] sm:text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
      title="Install Famousli app"
    >
      <Download className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Install app</span>
    </button>
  );
}
