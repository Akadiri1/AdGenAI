"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Activity, RefreshCw } from "lucide-react";

type LogEntry = {
  id: string;
  action: string;
  resource: string | null;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; email: string | null; name: string | null } | null;
};

const ACTION_COLORS: Record<string, string> = {
  user_signup: "bg-success/10 text-success",
  user_login: "bg-primary/10 text-primary",
  payment_received: "bg-success/10 text-success",
  payment_failed: "bg-danger/10 text-danger",
  ad_created: "bg-accent/10 text-accent",
  ad_published: "bg-primary/10 text-primary",
  user_suspended: "bg-warning/10 text-warning",
  plan_upgraded: "bg-success/10 text-success",
  admin_action: "bg-secondary/10 text-secondary",
};

export function ActivityFeed() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const lastIdRef = useRef<string | null>(null);

  async function load(initial = false) {
    try {
      const res = await fetch("/api/admin/activity?limit=100", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.logs);
      if (data.logs[0]) lastIdRef.current = data.logs[0].id;
    } finally {
      if (initial) setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
  }, []);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => load(), 4000);
    return () => clearInterval(interval);
  }, [paused]);

  return (
    <div className="rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/5 p-4">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${paused ? "bg-text-secondary" : "bg-success animate-pulse"}`} />
          <span className="text-xs font-semibold text-text-secondary">
            {paused ? "Paused" : "Live"} • {logs.length} events
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPaused((p) => !p)}
            className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-bg-secondary"
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={() => load()}
            className="flex items-center gap-1 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-bg-secondary"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {loading ? (
          <div className="p-10 text-center text-text-secondary">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center">
            <Activity className="mx-auto h-10 w-10 text-text-secondary opacity-30 mb-2" />
            <p className="text-sm text-text-secondary">No activity yet</p>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {logs.map((l) => {
              let meta: Record<string, unknown> = {};
              try { meta = l.metadata ? JSON.parse(l.metadata) : {}; } catch { /* ignore */ }
              const colorClass = ACTION_COLORS[l.action] ?? "bg-bg-secondary text-text-secondary";
              return (
                <div key={l.id} className="flex items-center gap-4 p-4 hover:bg-bg-secondary/30 transition-colors">
                  <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${colorClass}`}>
                    {l.action.replace(/_/g, " ")}
                  </span>
                  <div className="min-w-0 flex-1">
                    {l.user ? (
                      <Link href={`/admin/users/${l.user.id}`} className="text-sm font-semibold text-text-primary hover:text-primary truncate">
                        {l.user.name ?? l.user.email ?? "Anonymous"}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-text-secondary">System</span>
                    )}
                    {Object.keys(meta).length > 0 && (
                      <div className="text-xs text-text-secondary truncate">
                        {Object.entries(meta).map(([k, v]) => `${k}: ${String(v)}`).join(" • ")}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-text-secondary flex-shrink-0">
                    {timeAgo(new Date(l.createdAt))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}
