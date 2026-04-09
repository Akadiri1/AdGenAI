"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User as UserIcon, Mail, Phone, Calendar, CreditCard } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "INR", "BRL", "KES", "GHS", "ZAR", "JPY", "CNY"];

type Initial = {
  name: string;
  email: string;
  phone: string;
  plan: string;
  credits: number;
  country: string;
  language: string;
  currency: string;
  createdAt: string;
};

export function AccountClient({ initial }: { initial: Initial }) {
  const router = useRouter();
  const { success, error } = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          country: form.country,
          currency: form.currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      success("Account updated");
      router.refresh();
    } catch (err) {
      error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div>
        <h1 className="font-heading text-3xl font-bold text-text-primary">Account</h1>
        <p className="text-text-secondary">Manage your profile and preferences</p>
      </div>

      {/* Account info card */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-text-primary mb-4">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Plan" value={form.plan} />
          <InfoRow icon={<CreditCard className="h-4 w-4" />} label="Credits" value={form.credits.toString()} />
          {form.email && <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={form.email} />}
          {form.phone && <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={form.phone} />}
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label="Member since"
            value={new Date(form.createdAt).toLocaleDateString()}
          />
        </div>
      </div>

      {/* Editable fields */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-heading text-lg font-bold text-text-primary">Preferences</h2>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Display name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
            className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Country (ISO)
            </label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })}
              placeholder="US"
              maxLength={3}
              className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Currency
            </label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="h-12 w-full rounded-xl bg-primary font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-all"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function InfoRow({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-bg-secondary text-text-secondary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{label}</div>
        <div className="truncate text-sm font-semibold text-text-primary">{value}</div>
      </div>
    </div>
  );
}
