"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

/**
 * Mounted on the dashboard. When a user hits the dashboard while logged in
 * and a `referral` cookie is present, this calls /api/referrals/claim to
 * credit both parties. Safe to call repeatedly — endpoint is idempotent.
 */
export function ReferralClaimer() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    // Claim referral code if present
    const hasReferral = document.cookie.split("; ").some((c) => c.startsWith("referral="));
    if (hasReferral) {
      fetch("/api/referrals/claim", { method: "POST" }).catch(() => {});
    }

    // Apply signup name + business from cookie (set during signup form)
    const getName = (key: string) => {
      const match = document.cookie.split("; ").find((c) => c.startsWith(`${key}=`));
      if (!match) return null;
      try { return decodeURIComponent(match.split("=")[1]); } catch { return null; }
    };
    const signupName = getName("signup_name");
    const signupBusiness = getName("signup_business");
    if (signupName || signupBusiness) {
      fetch("/api/settings/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(signupName && { name: signupName }),
          ...(signupBusiness && { businessName: signupBusiness }),
        }),
      })
        .then(() => {
          document.cookie = "signup_name=; path=/; max-age=0";
          document.cookie = "signup_business=; path=/; max-age=0";
        })
        .catch(() => {});
    }
  }, [status]);

  return null;
}
