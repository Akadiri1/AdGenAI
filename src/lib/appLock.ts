/**
 * Client-side app lock — PIN + biometric (WebAuthn).
 *
 * Security model:
 *  - PIN is hashed with SHA-256 + a per-device random salt before storage.
 *  - Biometric credential ID is stored in localStorage; the actual biometric
 *    verification is handled by the OS via WebAuthn, not by our code.
 *  - This is CLIENT-SIDE only — it prevents casual shoulder-surfing / stolen
 *    device access. It does NOT replace server-side session security.
 *
 * Auto-lock triggers:
 *  - Explicit "Lock now" button
 *  - Tab becomes visible after being hidden for >= autoLockMinutes
 *  - Page load (if lock is enabled)
 */

const STORAGE_KEY = "famousli_applock";
const SALT_KEY = "famousli_applock_salt";

export type AppLockConfig = {
  enabled: boolean;
  pinHash: string | null;
  biometricCredentialId: string | null;
  autoLockMinutes: number; // default 5
  lastUnlockAt: number | null; // epoch ms
};

const DEFAULT_CONFIG: AppLockConfig = {
  enabled: false,
  pinHash: null,
  biometricCredentialId: null,
  autoLockMinutes: 5,
  lastUnlockAt: null,
};

export function getAppLockConfig(): AppLockConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveAppLockConfig(config: Partial<AppLockConfig>): void {
  if (typeof window === "undefined") return;
  const current = getAppLockConfig();
  const next = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearAppLock(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SALT_KEY);
}

/**
 * Get or create a random per-device salt. This stops a simple rainbow-table
 * attack if an attacker dumps localStorage — each device hashes its PIN with
 * a different random salt.
 */
function getSalt(): string {
  if (typeof window === "undefined") return "famousli";
  let salt = localStorage.getItem(SALT_KEY);
  if (!salt) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    salt = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(SALT_KEY, salt);
  }
  return salt;
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPin(pin: string): Promise<string> {
  const salt = getSalt();
  return sha256(`${salt}:${pin}`);
}

export async function setPin(pin: string): Promise<void> {
  if (pin.length < 4 || pin.length > 8) throw new Error("PIN must be 4-8 digits");
  const pinHash = await hashPin(pin);
  saveAppLockConfig({ enabled: true, pinHash, lastUnlockAt: Date.now() });
}

export async function verifyPin(pin: string): Promise<boolean> {
  const config = getAppLockConfig();
  if (!config.pinHash) return false;
  const inputHash = await hashPin(pin);
  return inputHash === config.pinHash;
}

/**
 * Biometric (WebAuthn) — register a new credential on this device.
 * The user will be prompted by the OS to authenticate (Touch ID, Windows Hello,
 * Android fingerprint, etc.) and we store the credential ID for future unlocks.
 */
export async function registerBiometric(userId: string, userName: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!window.PublicKeyCredential) {
    throw new Error("Biometric unlock not supported on this device/browser");
  }

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const userIdBytes = new TextEncoder().encode(userId);

  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "Famousli", id: window.location.hostname },
        user: {
          id: userIdBytes,
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },    // ES256
          { type: "public-key", alg: -257 },  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // on-device (Touch/Face/Hello)
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null;

    if (!credential) return false;

    const credentialId = btoa(
      String.fromCharCode(...new Uint8Array(credential.rawId)),
    );
    saveAppLockConfig({
      enabled: true,
      biometricCredentialId: credentialId,
      lastUnlockAt: Date.now(),
    });
    return true;
  } catch (err) {
    console.error("[appLock] biometric register failed:", err);
    throw new Error((err as Error).message || "Biometric setup cancelled");
  }
}

/**
 * Biometric unlock — prompts the OS for fingerprint/face, returns true on success.
 */
export async function verifyBiometric(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const config = getAppLockConfig();
  if (!config.biometricCredentialId) return false;
  if (!window.PublicKeyCredential) return false;

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const rawId = Uint8Array.from(atob(config.biometricCredentialId), (c) => c.charCodeAt(0));

  try {
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [
          { type: "public-key", id: rawId },
        ],
        userVerification: "required",
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    return !!assertion;
  } catch (err) {
    console.error("[appLock] biometric verify failed:", err);
    return false;
  }
}

export function markUnlocked(): void {
  saveAppLockConfig({ lastUnlockAt: Date.now() });
}

export function shouldLockNow(config: AppLockConfig): boolean {
  if (!config.enabled) return false;
  if (!config.pinHash && !config.biometricCredentialId) return false;
  if (!config.lastUnlockAt) return true; // never unlocked = locked
  const elapsed = Date.now() - config.lastUnlockAt;
  return elapsed > config.autoLockMinutes * 60 * 1000;
}

export function isBiometricSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.PublicKeyCredential;
}