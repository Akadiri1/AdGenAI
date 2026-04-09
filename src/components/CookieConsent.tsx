"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // always true
    analytics: true,
    preferences: true,
    marketing: false,
  });

  useEffect(() => {
    // Only show if no consent saved
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Small delay for smoother UX
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (value: Record<string, boolean>) => {
    localStorage.setItem("cookie_consent", JSON.stringify(value));
    setVisible(false);
  };

  const acceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      preferences: true,
      marketing: true,
    });
  };

  const rejectNonEssential = () => {
    saveConsent({
      essential: true,
      analytics: false,
      preferences: false,
      marketing: false,
    });
  };

  const saveCustom = () => {
    saveConsent({ ...preferences, essential: true });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="mx-auto max-w-4xl rounded-2xl border border-black/5 bg-white p-5 sm:p-6 shadow-2xl">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 flex-shrink-0">
                  <Cookie className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-text-primary">We use cookies</h3>
                  <p className="text-sm text-text-secondary mt-0.5">
                    We use cookies to improve your experience and analyze site traffic.{" "}
                    <Link href="/cookies" className="text-primary hover:underline font-medium">
                      Learn more
                    </Link>
                  </p>
                </div>
              </div>
              <button
                onClick={rejectNonEssential}
                className="text-text-secondary hover:text-text-primary transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Customize panel */}
            <AnimatePresence>
              {showCustomize && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="grid gap-3 sm:grid-cols-2 mb-4 pt-4 border-t border-black/5">
                    {/* Essential - always on */}
                    <label className="flex items-center gap-3 rounded-xl border border-black/5 bg-bg-secondary/30 p-3">
                      <input
                        type="checkbox"
                        checked
                        disabled
                        className="h-4 w-4 rounded accent-primary"
                      />
                      <div>
                        <div className="text-sm font-semibold text-text-primary">Essential</div>
                        <div className="text-xs text-text-secondary">Required for the site to work</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 rounded-xl border border-black/5 bg-bg-secondary/30 p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences((p) => ({ ...p, analytics: e.target.checked }))}
                        className="h-4 w-4 rounded accent-primary"
                      />
                      <div>
                        <div className="text-sm font-semibold text-text-primary">Analytics</div>
                        <div className="text-xs text-text-secondary">Help us improve the platform</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 rounded-xl border border-black/5 bg-bg-secondary/30 p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.preferences}
                        onChange={(e) => setPreferences((p) => ({ ...p, preferences: e.target.checked }))}
                        className="h-4 w-4 rounded accent-primary"
                      />
                      <div>
                        <div className="text-sm font-semibold text-text-primary">Preferences</div>
                        <div className="text-xs text-text-secondary">Remember your settings</div>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 rounded-xl border border-black/5 bg-bg-secondary/30 p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences((p) => ({ ...p, marketing: e.target.checked }))}
                        className="h-4 w-4 rounded accent-primary"
                      />
                      <div>
                        <div className="text-sm font-semibold text-text-primary">Marketing</div>
                        <div className="text-xs text-text-secondary">Measure ad effectiveness</div>
                      </div>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
              {showCustomize ? (
                <button
                  onClick={saveCustom}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  Save preferences
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowCustomize(true)}
                    className="rounded-xl border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-secondary"
                  >
                    Customize
                  </button>
                  <button
                    onClick={rejectNonEssential}
                    className="rounded-xl border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-secondary"
                  >
                    Reject non-essential
                  </button>
                  <button
                    onClick={acceptAll}
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                  >
                    Accept all
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
