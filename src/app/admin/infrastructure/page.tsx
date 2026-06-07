import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { RefreshCcw } from "lucide-react";
import Link from "next/link";
import { InfrastructureGrid } from "@/components/admin/InfrastructureGrid";

export const dynamic = "force-dynamic";

export default async function InfrastructurePage() {
  await requireAdmin();

  let initialProviders: any[] = [];
  try {
    initialProviders = await prisma.apiProvider.findMany({ 
      orderBy: { priority: "asc" } 
    });
  } catch (err) {
    initialProviders = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Infrastructure Health</h1>
          <p className="text-sm text-text-secondary">Monitor AI provider status and production chain performance in real-time</p>
        </div>
        <Link 
          href="/admin/infrastructure"
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold shadow-sm border border-black/5 hover:bg-bg-secondary transition-all"
        >
          <RefreshCcw className="h-3 w-3" /> Force Refresh
        </Link>
      </div>

      <InfrastructureGrid initialData={initialProviders} />

      {/* Production Chain Flow */}
      <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm">
        <h2 className="font-heading text-xl font-bold mb-6">Production Architecture</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 text-center min-w-[140px]">
            <div className="text-[10px] font-bold uppercase text-primary mb-1">Primary</div>
            <div className="font-bold text-sm">Qwen Cloud</div>
            <div className="text-[9px] text-text-secondary">Text, Video & Speech</div>
          </div>
          <div className="h-0.5 w-8 bg-black/10 hidden sm:block" />
          <div className="rounded-2xl border-2 border-warning/20 bg-warning/5 p-4 text-center min-w-[140px]">
            <div className="text-[10px] font-bold uppercase text-warning mb-1">Secondary</div>
            <div className="font-bold text-sm">Replicate</div>
            <div className="text-[9px] text-text-secondary">Kling, Nano & Kokoro</div>
          </div>
        </div>
      </div>
    </div>
  );
}
