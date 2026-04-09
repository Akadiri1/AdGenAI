"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { ShoppingCart, Sparkles, Loader2 } from "lucide-react";

export function TemplateActions({
  templateId,
  isPremium,
  price,
}: {
  templateId: string;
  isPremium: boolean;
  price: number | null;
}) {
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  async function buyAndUse() {
    setLoading(true);
    try {
      // Buy first if premium
      if (isPremium && price) {
        const buyRes = await fetch(`/api/templates/${templateId}/buy`, { method: "POST" });
        const buyData = await buyRes.json();
        if (!buyRes.ok) throw new Error(buyData.error ?? "Purchase failed");
        success("Template purchased!");
      }

      // Use template — creates a draft ad
      const useRes = await fetch(`/api/templates/${templateId}/use`, { method: "POST" });
      const useData = await useRes.json();
      if (!useRes.ok) throw new Error(useData.error ?? "Failed to use template");

      success("Ad created from template — edit it in Studio");
      router.push(`/ads/${useData.adId}/studio`);
    } catch (err) {
      error((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={buyAndUse}
      disabled={loading}
      className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPremium ? (
        <ShoppingCart className="h-4 w-4" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {loading
        ? "Loading..."
        : isPremium
          ? `Buy & use (${price} credits)`
          : "Use template"}
    </button>
  );
}
