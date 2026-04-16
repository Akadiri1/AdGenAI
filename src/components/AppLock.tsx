"use client";

import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Delete, Shield, Lock } from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  getAppLockConfig,
  verifyPin,
  verifyBiometric,
  markUnlocked,
  isBiometricSupported,
} from "@/lib/appLock";

/**
 * Lock logic:
 * - On first app open / PWA launch → locked (if enabled)
 * - After unlock → stays unlocked while navigating pages
 * - When user leaves the app (tab hidden / app switch) → mark "left at" timestamp
 * - When user returns (tab visible) → only re-lock if they were gone for 5+ seconds
 *   (prevents re-locking on quick tab switches or keyboard popup)
 * - Page navigation within the app NEVER triggers lock
 */
const LOCK_KEY = "famousli_lock_state";
const HIDE_KEY = "famousli_hidden_at";

function isCurrentlyUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LOCK_KEY) === "unlocked";
  } catch { return false; }
}

function setUnlockedState(unlocked: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (unlocked) localStorage.setItem(LOCK_KEY, "unlocked");
    else localStorage.removeItem(LOCK_KEY);
  } catch { /* ignore */ }
}

export function AppLock({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [locked, setLocked] = useState(false);

  // On mount: lock only if NOT already unlocked in this browsing session
  useEffect(() => {
    const config = getAppLockConfig();
    const hasLock = config.enabled && (config.pinHash || config.biometricCredentialId);

    if (hasLock && !isCurrentlyUnlocked()) {
      setLocked(true);
    }
    setChecked(true);
  }, []);

  // When user leaves app → record timestamp. When they return → re-lock only if gone 5+ sec
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        localStorage.setItem(HIDE_KEY, String(Date.now()));
      } else if (document.visibilityState === "visible") {
        const hiddenAt = Number(localStorage.getItem(HIDE_KEY) ?? "0");
        const goneMs = Date.now() - hiddenAt;
        // Only re-lock if user was away for 5+ seconds (avoids keyboard popup, quick tab switch)
        if (goneMs > 5000) {
          const config = getAppLockConfig();
          if (config.enabled && (config.pinHash || config.biometricCredentialId)) {
            setLocked(true);
            setUnlockedState(false);
          }
        }
        localStorage.removeItem(HIDE_KEY);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const handleUnlock = useCallback(() => {
    markUnlocked();
    setLocked(false);
    setUnlockedState(true);
  }, []);

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

  useEffect(() => {
    if (!hasBiometric) return;
    let cancelled = false;
    (async () => {
      try {
        const ok = await verifyBiometric();
        if (!cancelled && ok) onUnlock();
      } catch { /* fall back to PIN */ }
    })();
    return () => { cancelled = true; };
  }, [hasBiometric, onUnlock]);

  async function submitPin(value: string) {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await verifyPin(value);
      if (ok) { onUnlock(); }
      else {
        setError("Wrong PIN");
        setPin("");
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }
    } finally { setBusy(false); }
  }

  function pressDigit(d: string) {
    setError(null);
    const next = (pin + d).slice(0, 8);
    setPin(next);
    if (next.length === 4 && config.pinHash) submitPin(next);
  }

  async function handleBiometricButton() {
    setError(null);
    try {
      const ok = await verifyBiometric();
      if (ok) onUnlock();
      else setError("Biometric failed — try again or use PIN");
    } catch {
      setError("Biometric failed — try again or use PIN");
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white p-6">
      {/* Logo + brand */}
      <div className="mb-8 flex flex-col items-center">
        <Logo size="xl" withText={false} />
        <h1 className="mt-4 font-heading text-2xl font-bold text-text-primary">
          Famousli
        </h1>
        <div className="mt-2 flex items-center gap-1.5 text-sm text-text-secondary">
          <Lock className="h-3.5 w-3.5" />
          <span>
            {hasPin && hasBiometric && "Enter PIN or use biometric"}
            {hasPin && !hasBiometric && "Enter your PIN to unlock"}
            {!hasPin && hasBiometric && "Use biometric to unlock"}
          </span>
        </div>
      </div>

      {/* PIN dots */}
      {hasPin && (
        <div className="mb-6 flex items-center justify-center gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? "bg-primary scale-110"
                  : "bg-black/10 border-2 border-black/20"
              }`}
            />
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-danger/10 border border-danger/20 px-4 py-2 text-sm font-semibold text-danger">
          {error}
        </div>
      )}

      {/* PIN keypad */}
      {hasPin && (
        <div className="w-full max-w-[280px] grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => pressDigit(String(d))}
              disabled={busy}
              className="flex h-16 w-full items-center justify-center rounded-2xl bg-black/5 text-2xl font-bold text-text-primary hover:bg-black/10 active:scale-90 transition-all disabled:opacity-40"
            >
              {d}
            </button>
          ))}
          {hasBiometric ? (
            <button
              type="button"
              onClick={handleBiometricButton}
              disabled={busy}
              className="flex h-16 w-full items-center justify-center rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 active:scale-90 transition-all disabled:opacity-40"
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
            className="flex h-16 w-full items-center justify-center rounded-2xl bg-black/5 text-2xl font-bold text-text-primary hover:bg-black/10 active:scale-90 transition-all disabled:opacity-40"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => { setError(null); setPin(pin.slice(0, -1)); }}
            disabled={busy || pin.length === 0}
            className="flex h-16 w-full items-center justify-center rounded-2xl bg-black/5 text-text-secondary hover:bg-black/10 active:scale-90 transition-all disabled:opacity-20"
            aria-label="Backspace"
          >
            <Delete className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Biometric-only mode (no PIN set) — big friendly button */}
      {!hasPin && hasBiometric && (
        <div className="w-full max-w-[280px] space-y-4">
          <button
            type="button"
            onClick={handleBiometricButton}
            disabled={busy}
            className="w-full flex flex-col items-center justify-center gap-3 rounded-3xl bg-black/5 border border-black/10 py-10 text-text-primary hover:bg-black/8 active:scale-95 transition-all disabled:opacity-40"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Fingerprint className="h-10 w-10 text-primary" />
            </div>
            <span className="text-base font-semibold">Tap to unlock</span>
            <span className="text-xs text-text-secondary">Fingerprint or Face ID</span>
          </button>
        </div>
      )}

      {/* Emergency sign out */}
      <div className="mt-8">
        <a
          href="/api/auth/signout"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <Shield className="h-3 w-3" /> Sign out instead
        </a>
      </div>
    </div>
  );
}