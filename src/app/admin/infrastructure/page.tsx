import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { Server, Activity, AlertCircle, CheckCircle2, Clock, Zap, RefreshCcw } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InfrastructurePage() {
  await requireAdmin();

  // Safety check: ensure apiProvider exists on prisma (requires db push)
  const providers = (prisma as any).apiProvider 
    ? await (prisma as any).apiProvider.findMany({ orderBy: { priority: "asc" } })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Infrastructure Health</h1>
          <p className="text-sm text-text-secondary">Monitor AI provider status and production chain performance</p>
        </div>
        <Link 
          href="/admin/infrastructure"
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold shadow-sm border border-black/5 hover:bg-bg-secondary transition-all"
        >
          <RefreshCcw className="h-3 w-3" /> Refresh Status
        </Link>
      </div>

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
                <div className="capitalize font-heading font-bold text-lg">{p.name}</div>
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
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Priority
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

        {providers.length === 0 && (
          <div className="col-span-full py-12 text-center rounded-3xl border-2 border-dashed border-black/10">
            <Server className="h-10 w-10 text-text-secondary mx-auto mb-3 opacity-20" />
            <div className="text-text-secondary font-medium">No API providers tracked yet.</div>
            <p className="text-xs text-text-secondary opacity-60">Try generating a video to initialize tracking.</p>
          </div>
        )}
      </div>

      {/* Production Chain Flow */}
      <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm">
        <h2 className="font-heading text-xl font-bold mb-6">Production Chain Logic</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 text-center min-w-[140px]">
            <div className="text-[10px] font-bold uppercase text-primary mb-1">Step 1</div>
            <div className="font-bold text-sm">SiliconFlow</div>
            <div className="text-[9px] text-text-secondary">Ultra Fast</div>
          </div>
          <div className="h-0.5 w-8 bg-black/10 hidden sm:block" />
          <div className="rounded-2xl border-2 border-accent/20 bg-accent/5 p-4 text-center min-w-[140px]">
            <div className="text-[10px] font-bold uppercase text-accent mb-1">Step 2</div>
            <div className="font-bold text-sm">Fal.ai (Luma)</div>
            <div className="text-[9px] text-text-secondary">Reliable Speed</div>
          </div>
          <div className="h-0.5 w-8 bg-black/10 hidden sm:block" />
          <div className="rounded-2xl border-2 border-warning/20 bg-warning/5 p-4 text-center min-w-[140px]">
            <div className="text-[10px] font-bold uppercase text-warning mb-1">Step 3</div>
            <div className="font-bold text-sm">Kling AI</div>
            <div className="text-[9px] text-text-secondary">Premium Detail</div>
          </div>
          <div className="h-0.5 w-8 bg-black/10 hidden sm:block" />
          <div className="rounded-2xl border-2 border-secondary/20 bg-secondary/5 p-4 text-center min-w-[140px]">
            <div className="text-[10px] font-bold uppercase text-secondary mb-1">Step 4</div>
            <div className="font-bold text-sm">Magic API</div>
            <div className="text-[9px] text-text-secondary">Final AI Backup</div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-black/5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" /> Auto-Failover
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                The system automatically jumps to the next available provider if one fails or times out. Users are never billed for failed AI generations.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-danger" /> Degraded State
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                If a provider fails 5 times in a row, it is marked as "Offline" and skipped until manually reset or successful in a future automatic retry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
