"use client";

import { useEffect, useState } from "react";
import { Lock, Fingerprint, Check, X, Trash2, Shield } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";
import {
  getAppLockConfig,
  setPin,
  registerBiometric,
  saveAppLockConfig,
  clearAppLock,
  isBiometricSupported,
  type AppLockConfig,
} from "@/lib/appLock";

export function SecurityClient() {
  const { data: session } = useSession();
  const { success, error: toastError } = useToast();
  const [config, setConfig] = useState<AppLockConfig | null>(null);
  const [biometricSupported, setBiometricSupported] = useState(false);

  // PIN setup state
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [savingPin, setSavingPin] = useState(false);

  // Biometric state
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    setConfig(getAppLockConfig());
    setBiometricSupported(isBiometricSupported());
  }, []);

  async function handleSetPin(e: React.FormEvent) {
    e.preventDefault();
    if (newPin.length < 4) { toastError("PIN must be at least 4 digits"); return; }
    if (newPin.length > 8) { toastError("PIN must be 8 digits or fewer"); return; }
    if (!/^\d+$/.test(newPin)) { toastError("PIN must be numbers only"); return; }
    if (newPin !== confirmPin) { toastError("PINs don't match"); return; }

    setSavingPin(true);
    try {
      await setPin(newPin);
      setConfig(getAppLockConfig());
      setNewPin("");
      setConfirmPin("");
      setShowPinSetup(false);
      success("PIN saved — app will lock after 5 minutes of inactivity");
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSavingPin(false);
    }
  }

  async function handleEnableBiometric() {
    if (!session?.user) { toastError("Sign in first"); return; }
    setSavingBio(true);
    try {
      const userId = (session.user as { id?: string }).id ?? session.user.email ?? "user";
      const userName = session.user.name ?? session.user.email ?? "Famousli User";
      const ok = await registerBiometric(userId, userName);
      if (ok) {
        setConfig(getAppLockConfig());
        success("Biometric enabled");
      }
    } catch (err) {
      toastError((err as Error).message);
    } finally {
      setSavingBio(false);
    }
  }

  function handleDisableBiometric() {
    saveAppLockConfig({ biometricCredentialId: null });
    setConfig(getAppLockConfig());
    success("Biometric disabled");
  }

  function handleRemovePin() {
    if (!confirm("Remove PIN? You won't need to enter a code to open the app anymore.")) return;
    saveAppLockConfig({ pinHash: null });
    setConfig(getAppLockConfig());
    success("PIN removed");
  }

  function handleDisableAllLock() {
    if (!confirm("Turn off app lock completely? This removes both PIN and biometric.")) return;
    clearAppLock();
    setConfig(getAppLockConfig());
    success("App lock disabled");
  }

  function updateAutoLockMinutes(minutes: number) {
    saveAppLockConfig({ autoLockMinutes: minutes });
    setConfig(getAppLockConfig());
    success(`Auto-lock set to ${minutes} min`);
  }

  if (!config) return <div className="text-text-secondary">Loading…</div>;

  const hasPin = !!config.pinHash;
  const hasBio = !!config.biometricCredentialId;
  const anyLockEnabled = hasPin || hasBio;

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={`rounded-2xl border-2 p-4 flex items-start gap-3 ${
        anyLockEnabled
          ? "border-success/30 bg-success/5"
          : "border-warning/30 bg-warning/5"
      }`}>
        <Shield className={`h-5 w-5 flex-shrink-0 mt-0.5 ${anyLockEnabled ? "text-success" : "text-warning"}`} />
        <div className="min-w-0 flex-1">
          <div className={`font-semibold text-sm ${anyLockEnabled ? "text-success" : "text-warning"}`}>
            {anyLockEnabled ? "App lock is enabled" : "App lock is OFF"}
          </div>
          <div className="text-xs text-text-secondary mt-0.5">
            {anyLockEnabled
              ? `Auto-locks after ${config.autoLockMinutes} min of inactivity`
              : "Anyone with access to this device can open Famousli"}
          </div>
        </div>
      </div>

      {/* PIN section */}
      <div className="rounded-2xl border border-black/5 bg-white dark:bg-white/5 p-4 sm:p-5 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
            <Lock className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading font-bold text-text-primary">PIN</h2>
            <p className="text-xs text-text-secondary">
              4-8 digits. Stored as a salted SHA-256 hash on this device only.
            </p>
          </div>
          {hasPin && (
            <span className="rounded-md bg-success/10 px-2 py-1 text-[10px] font-bold uppercase text-success flex-shrink-0">
              <Check className="h-3 w-3 inline mr-0.5" /> Set
            </span>
          )}
        </div>

        {!showPinSetup && !hasPin && (
          <button
            onClick={() => setShowPinSetup(true)}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Set a PIN
          </button>
        )}

        {!showPinSetup && hasPin && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowPinSetup(true)}
              className="flex-1 rounded-xl border-2 border-black/10 dark:border-white/15 bg-white dark:bg-white/5 py-2.5 text-sm font-semibold text-text-primary hover:bg-bg-secondary"
            >
              Change PIN
            </button>
            <button
              onClick={handleRemovePin}
              className="flex items-center justify-center gap-1 rounded-xl border-2 border-danger/20 bg-danger/5 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10"
            >
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          </div>
        )}

        {showPinSetup && (
          <form onSubmit={handleSetPin} className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                New PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="new-password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                maxLength={8}
                placeholder="4-8 digits"
                className="w-full mt-1 rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Confirm PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="new-password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                maxLength={8}
                placeholder="Re-enter PIN"
                className="w-full mt-1 rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingPin}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {savingPin ? "Saving…" : "Save PIN"}
              </button>
              <button
                type="button"
                onClick={() => { setShowPinSetup(false); setNewPin(""); setConfirmPin(""); }}
                className="rounded-xl border-2 border-black/10 px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-bg-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Biometric section */}
      <div className="rounded-2xl border border-black/5 bg-white dark:bg-white/5 p-4 sm:p-5 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent flex-shrink-0">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading font-bold text-text-primary">Biometric</h2>
            <p className="text-xs text-text-secondary">
              Fingerprint, Face ID, or Windows Hello. Verification is done by your device,
              never by Famousli.
            </p>
          </div>
          {hasBio && (
            <span className="rounded-md bg-success/10 px-2 py-1 text-[10px] font-bold uppercase text-success flex-shrink-0">
              <Check className="h-3 w-3 inline mr-0.5" /> On
            </span>
          )}
        </div>

        {!biometricSupported && (
          <div className="rounded-xl bg-bg-secondary dark:bg-white/5 p-3 text-xs text-text-secondary">
            <X className="h-3 w-3 inline mr-1" /> Biometric unlock is not supported on this device
            or browser. Try opening Famousli on a modern phone or laptop with fingerprint/face unlock.
          </div>
        )}

        {biometricSupported && !hasBio && (
          <button
            onClick={handleEnableBiometric}
            disabled={savingBio}
            className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {savingBio ? "Waiting for device…" : "Enable biometric unlock"}
          </button>
        )}

        {biometricSupported && hasBio && (
          <button
            onClick={handleDisableBiometric}
            className="w-full rounded-xl border-2 border-danger/20 bg-danger/5 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10"
          >
            Disable biometric
          </button>
        )}
      </div>

      {/* Auto-lock timing */}
      {anyLockEnabled && (
        <div className="rounded-2xl border border-black/5 bg-white dark:bg-white/5 p-4 sm:p-5 shadow-sm">
          <h2 className="font-heading font-bold text-text-primary mb-3">Auto-lock after</h2>
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 15, 30].map((min) => (
              <button
                key={min}
                onClick={() => updateAutoLockMinutes(min)}
                className={`rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
                  config.autoLockMinutes === min
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-black/10 dark:border-white/15 bg-white dark:bg-white/5 text-text-primary hover:bg-bg-secondary"
                }`}
              >
                {min} min
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Disable everything */}
      {anyLockEnabled && (
        <div className="pt-2">
          <button
            onClick={handleDisableAllLock}
            className="text-xs text-text-secondary hover:text-danger underline"
          >
            Turn off app lock completely
          </button>
        </div>
      )}
    </div>
  );
}