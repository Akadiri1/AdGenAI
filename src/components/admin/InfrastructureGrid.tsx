"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, Clock, Zap, Server } from "lucide-react";

export function InfrastructureGrid({ initialData }: { initialData: any[] }) {
  const [providers, setProviders] = useState(initialData);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/infrastructure");
        if (res.ok) {
          const data = await res.json();
          setProviders(data);
        }
      } catch (err) {
        console.error("Failed to poll infrastructure status:", err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (providers.length === 0) {
    return (
      <div className="col-span-full py-12 text-center rounded-3xl border-2 border-dashed border-black/10">
        <Server className="h-10 w-10 text-text-secondary mx-auto mb-3 opacity-20" />
        <div className="text-text-secondary font-medium">No API providers tracked yet.</div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {providers.map((p: any) => {
        const isOnline = p.status === "online";
        const isDegraded = p.status === "degraded";
        const StatusIcon = isOnline ? CheckCircle2 : isDegraded ? Activity : AlertCircle;

        return (
          <div key={p.id} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 right-0 h-1.5 w-full ${
              isOnline ? "bg-success" : isDegraded ? "bg-warning" : "bg-danger"
            }`} />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <div className="capitalize font-heading font-bold text-lg leading-tight">{p.name}</div>
                {p.isLiveVerified && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] font-bold text-success uppercase tracking-wider">Live Verified</span>
                  </div>
                )}
              </div>
              <StatusIcon className={`h-5 w-5 ${
                isOnline ? "text-success" : isDegraded ? "text-warning" : "text-danger"
              }`} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Status</span>
                <span className={`font-bold uppercase ${
                  isOnline ? "text-success" : isDegraded ? "text-warning" : "text-danger"
                }`}>{p.status}</span>
              </div>
              {p.tokensUsed > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Usage
                  </span>
                  <span className="font-semibold">{p.tokensUsed.toLocaleString()} tokens</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Priority
                </span>
                <span className="font-semibold">{p.priority}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Errors
                </span>
                <span className={`font-semibold ${p.errorCount > 0 ? "text-danger" : ""}`}>
                  {p.errorCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-black/5 pt-2">
                <span className="text-text-secondary flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Last Success
                </span>
                <span className="font-medium">
                  {p.lastSuccessAt ? new Date(p.lastSuccessAt).toLocaleTimeString() : "Never"}
                </span>
              </div>
            </div>

            {p.lastError && (
              <div className="mt-4 rounded-xl bg-danger/5 p-3 border border-danger/10">
                <div className="text-[10px] font-bold text-danger uppercase mb-1">Recent Error</div>
                <div className="text-[10px] text-danger/80 line-clamp-2 leading-relaxed">
                  {p.lastError}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
