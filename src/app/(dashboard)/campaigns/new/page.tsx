"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft } from "lucide-react";

const OBJECTIVES = [
  { key: "awareness", label: "Brand awareness", description: "Get people to know your brand" },
  { key: "traffic", label: "Traffic", description: "Drive visits to your site" },
  { key: "conversions", label: "Conversions", description: "Get sign-ups or purchases" },
  { key: "sales", label: "Sales", description: "Maximize revenue" },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("traffic");
  const [budget, setBudget] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    setSaving(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          objective,
          budget: budget ? Number(budget) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create campaign");
      success("Campaign created");
      router.push(`/campaigns/${data.id}`);
    } catch (err) {
      toastError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/campaigns"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-text-primary mb-6">New Campaign</h1>

        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Campaign name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Summer sale 2026"
              className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Objective
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {OBJECTIVES.map((o) => (
                <label
                  key={o.key}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-all ${
                    objective === o.key ? "border-primary bg-primary/5" : "border-black/10 hover:border-black/20"
                  }`}
                >
                  <input
                    type="radio"
                    checked={objective === o.key}
                    onChange={() => setObjective(o.key)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-heading text-sm font-semibold text-text-primary">{o.label}</div>
                    <div className="text-xs text-text-secondary">{o.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Budget (optional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
              <input
                type="number"
                min="0"
                step="1"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="500"
                className="w-full rounded-xl border-2 border-black/10 bg-white pl-8 pr-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            onClick={create}
            disabled={saving || !name.trim()}
            className="h-12 w-full rounded-xl bg-primary font-semibold text-white transition-all hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create campaign"}
          </button>
        </div>
      </div>
    </div>
  );
}
