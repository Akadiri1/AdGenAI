"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[StudioError]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 mx-auto mb-4">
        <AlertTriangle className="h-8 w-8 text-danger" />
      </div>
      <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">Studio failed to load</h2>
      <p className="text-sm text-text-secondary mb-2">{error.message}</p>
      {error.digest && <p className="text-xs text-text-secondary mb-6 font-mono">{error.digest}</p>}
      <div className="flex gap-3 justify-center">
        <button onClick={reset}
          className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark">
          Try again
        </button>
        <Link href="/ads"
          className="flex h-10 items-center gap-2 rounded-xl border-2 border-black/10 px-4 text-sm font-semibold text-text-primary hover:bg-bg-secondary">
          Back to My Ads
        </Link>
      </div>
    </div>
  );
}
