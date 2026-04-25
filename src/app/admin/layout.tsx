import { requireAdmin } from "@/lib/adminAuth";
import Link from "next/link";
import { ShieldCheck, ChevronLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { AdminBottomNav } from "./AdminBottomNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-bg-secondary/20">
      {/* Top bar — slim, no sidebar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-black/5 bg-white/80 backdrop-blur-lg px-3 sm:px-6">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Logo size="sm" />
          <div className="flex items-center gap-1.5 rounded-md bg-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-danger flex-shrink-0">
            <ShieldCheck className="h-3 w-3" />
            Admin
          </div>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1 text-xs font-semibold text-text-secondary hover:bg-bg-secondary"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Exit
        </Link>
      </header>

      {/* Main content — extra bottom padding so content isn't hidden behind nav */}
      <main className="px-3 py-4 sm:p-6 pb-24">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      <AdminBottomNav adminEmail={admin.email ?? ""} />
    </div>
  );
}
