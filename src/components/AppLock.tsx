"use client";

import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Delete, Shield } from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  getAppLockConfig,
  verifyPin,
  verifyBiometric,
  markUnlocked,
  shouldLockNow,
  isBiometricSupported,
} from "@/lib/appLock";

/**
 * App lock overlay — shows a full-screen PIN/biometric prompt when the app
 * should be locked. Once unlocked, disappears and lets the dashboard render.
 *
 * Triggers:
 *  - Initial mount (if lock is enabled + lastUnlockAt is stale)
 *  - Tab visibility change after being hidden for the auto-lock window
 */
export function AppLock({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [locked, setLocked] = useState(false);

  // Check lock state on mount
  useEffect(() => {
    const config = getAppLockConfig();
    setLocked(shouldLockNow(config));
    setChecked(true);
  }, []);

  // Re-check lock when tab becomes visible again
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible") {
        const config = getAppLockConfig();
        if (shouldLockNow(config)) setLocked(true);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const handleUnlock = useCallback(() => {
    markUnlocked();
    setLocked(false);
  }, []);

  // Don't render anything until we know the lock state (prevents flash)
  if (!checked) return null;

  return (
    <>
      {children}
      {locked && <LockScreen onUnlock={handleUnlock} />}
    </>
  );
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const config = getAppLockConfig();
  const hasPin = !!config.pinHash;
  const hasBiometric = !!config.biometricCredentialId && isBiometricSupported();

  // Auto-attempt biometric on mount (if enabled)
  useEffect(() => {
    if (!hasBiometric) return;
    let cancelled = false;
    (async () => {
      try {
        const ok = await verifyBiometric();
        if (!cancelled && ok) onUnlock();
      } catch {
        /* user cancelled or error — fall back to PIN */
      }
    })();
    return () => { cancelled = true; };
  }, [hasBiometric, onUnlock]);

  async function submitPin(value: string) {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await verifyPin(value);
      if (ok) {
        onUnlock();
      } else {
        setError("Incorrect PIN");
        setPin("");
        // Haptic feedback on mobile
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }
    } finally {
      setBusy(false);
    }
  }

  function pressDigit(d: string) {
    setError(null);
    const next = (pin + d).slice(0, 8);
    setPin(next);
    // Auto-submit at 4 digits if user prefers (most common)
    if (next.length === 4 && config.pinHash) {
      submitPin(next);
    }
  }

  async function handleBiometricButton() {
    setError(null);
    try {
      const ok = await verifyBiometric();
      if (ok) onUnlock();
      else setError("Biometric authentication failed");
    } catch {
      setError("Biometric authentication failed");
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-bg-dark/95 backdrop-blur-lg p-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-bg-dark/80 p-6 sm:p-8 text-center">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" withText={false} />
        </div>

        <h1 className="font-heading text-xl sm:text-2xl font-bold text-white mb-2">
          Famousli is locked
        </h1>
        <p className="text-sm text-white/60 mb-8">
          {hasPin && hasBiometric && "Use your PIN or biometric to unlock"}
          {hasPin && !hasBiometric && "Enter your PIN to unlock"}
          {!hasPin && hasBiometric && "Use biometric to unlock"}
        </p>

        {/* PIN dots */}
        {hasPin && (
          <div className="mb-8 flex items-center justify-center gap-3">
            {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-full border-2 transition-all ${
                  i < pin.length
                    ? "bg-primary border-primary scale-110"
                    : "border-white/25"
                }`}
              />
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 text-sm font-semibold text-danger animate-[shake_0.4s]">
            {error}
          </div>
        )}

        {/* PIN keypad */}
        {hasPin && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => pressDigit(String(d))}
                disabled={busy}
                className="flex h-16 items-center justify-center rounded-2xl bg-white/5 text-2xl font-bold text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-40"
              >
                {d}
              </button>
            ))}
            {hasBiometric ? (
              <button
                type="button"
                onClick={handleBiometricButton}
                disabled={busy}
                className="flex h-16 items-center justify-center rounded-2xl bg-primary/20 text-primary hover:bg-primary/30 active:scale-95 transition-all disabled:opacity-40"
                aria-label="Use biometric"
              >
                <Fingerprint className="h-7 w-7" />
              </button>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={() => pressDigit("0")}
              disabled={busy}
              className="flex h-16 items-center justify-center rounded-2xl bg-white/5 text-2xl font-bold text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-40"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => { setError(null); setPin(pin.slice(0, -1)); }}
              disabled={busy || pin.length === 0}
              className="flex h-16 items-center justify-center rounded-2xl bg-white/5 text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-40"
              aria-label="Backspace"
            >
              <Delete className="h-6 w-6" />
            </button>
          </div>
        )}

        {/* Biometric-only mode */}
        {!hasPin && hasBiometric && (
          <button
            type="button"
            onClick={handleBiometricButton}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-primary text-white font-semibold hover:bg-primary-dark active:scale-95 transition-all disabled:opacity-40"
          >
            <Fingerprint className="h-5 w-5" />
            Unlock with biometric
          </button>
        )}

        {/* Emergency fallback — sign out */}
        <div className="mt-6 border-t border-white/10 pt-4">
          <a
            href="/api/auth/signout"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            <Shield className="h-3 w-3" /> Sign out instead
          </a>
        </div>
      </div>
    </div>
  );
}