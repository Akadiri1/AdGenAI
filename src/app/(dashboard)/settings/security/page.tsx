import { SecurityClient } from "./SecurityClient";

export const dynamic = "force-dynamic";

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary">
          App Security
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Protect your Famousli app with a PIN or your device&apos;s fingerprint
        </p>
      </div>
      <SecurityClient />
    </div>
  );
}