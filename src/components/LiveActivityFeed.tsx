"use client";

import { useEffect, useState } from "react";
import { Activity, Film, CreditCard, CheckCircle2 } from "lucide-react";

type LogEntry = {
  id: string;
  action: string;
  resource: string | null;
  metadata: string | null;
  createdAt: string;
};

type Ad = {
  id: string;
  headline: string | null;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type Tx = {
  id: string;
  type: string;
  amount: number;
  status: string;
  provider: string;
  createdAt: string;
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ad_created: Film,
  ad_published: CheckCircle2,
  ad_edited: Film,
  payment_received: CreditCard,
  credits_purchased: CreditCard,
  plan_upgraded: CreditCard,
};

export function LiveActivityFeed({ compact = false }: { compact?: boolean }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [tx, setTx] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/me/activity?limit=20", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.logs);
      setAds(data.recentAds);
      setTx(data.recentTx);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  // Merge into unified timeline
  const items = [
    ...logs.map((l) => ({
      kind: "log" as const,
      id: `log-${l.id}`,
      date: l.createdAt,
      label: l.action.replace(/_/g, " "),
      sub: parseMetaSummary(l.metadata),
      icon: ICONS[l.action] ?? Activity,
    })),
    ...ads.map((a) => ({
      kind: "ad" as const,
      id: `ad-${a.id}`,
      date: a.updatedAt,
      label: a.headline ?? "Untitled ad",
      sub: `${a.type} • ${a.status}`,
      icon: Film,
    })),
    ...tx.map((t) => ({
      kind: "tx" as const,
      id: `tx-${t.id}`,
      date: t.createdAt,
      label: `${t.type} via ${t.provider}`,
      sub: `$${t.amount.toFixed(2)} • ${t.status}`,
      icon: CreditCard,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, compact ? 8 : 30);

  return (
    <div className="rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/5 p-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-bold text-text-primary">Live Activity</span>
        </div>
        <span className="text-xs text-text-secondary">Auto-refreshing</span>
      </div>
      <div className={compact ? "max-h-[420px] overflow-y-auto" : "max-h-[70vh] overflow-y-auto"}>
        {loading ? (
          <div className="p-8 text-center text-sm text-text-secondary">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="mx-auto h-8 w-8 text-text-secondary opacity-30 mb-2" />
            <p className="text-sm text-text-secondary">Your activity will appear here in real time</p>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-bg-secondary/30">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-text-primary truncate capitalize">{item.label}</div>
                    {item.sub && <div className="text-xs text-text-secondary truncate">{item.sub}</div>}
                  </div>
                  <div className="text-xs text-text-secondary flex-shrink-0">{timeAgo(new Date(item.date))}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function parseMetaSummary(meta: string | null): string {
  if (!meta) return "";
  try {
    const obj = JSON.parse(meta);
    return Object.entries(obj).slice(0, 2).map(([k, v]) => `${k}: ${String(v)}`).join(" • ");
  } catch { return ""; }
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}
