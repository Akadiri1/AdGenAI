"use client";

import { useEffect } from "react";
import { isNative, initStatusBar } from "@/lib/native";

/**
 * Initializes native platform features when running as a Capacitor app.
 * Does nothing on web.
 */
export function NativeInit() {
  useEffect(() => {
    if (!isNative()) return;

    initStatusBar();

    // Handle back button on Android
    import("@capacitor/app").then(({ App }) => {
      App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });
    });

    // Add native class to body for CSS targeting
    document.body.classList.add("capacitor-app");

    // Handle safe areas
    document.documentElement.style.setProperty(
      "--safe-top",
      "env(safe-area-inset-top, 0px)",
    );
    document.documentElement.style.setProperty(
      "--safe-bottom",
      "env(safe-area-inset-bottom, 0px)",
    );
  }, []);

  return null;
}
