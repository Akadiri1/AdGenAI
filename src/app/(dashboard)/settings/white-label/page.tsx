import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, FileText, Check, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WhiteLabelPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return <div className="p-8 text-center"><Link href="/auth/login" className="text-primary">Log in</Link></div>;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, brandLogo: true, businessName: true },
  });

  const hasAccess = ["BUSINESS", "ENTERPRISE"].includes(user?.plan ?? "FREE");

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href="/settings" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-text-secondary"><ArrowLeft className="h-4 w-4" /> Settings</Link>
        <div className="rounded-3xl border-2 border-warning/20 bg-warning/5 p-10 text-center">
          <Lock className="mx-auto h-12 w-12 text-warning mb-4" />
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">White Label Exports</h1>
          <p className="text-text-secondary mb-6">Export ads with your own branding — no Famousli watermark. Available on Business and Enterprise plans.</p>
          <Link href="/settings/billing" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white hover:bg-primary-dark">Upgrade</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary"><ArrowLeft className="h-4 w-4" /> Settings</Link>
      <div>
        <h1 className="font-heading text-3xl font-bold text-text-primary">White Label Exports</h1>
        <p className="text-text-secondary">Your ads, your branding — no Famousli anywhere</p>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-heading text-lg font-bold text-text-primary">Current configuration</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-black/5 p-4">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-success" />
              <div>
                <div className="text-sm font-semibold text-text-primary">Famousli watermark removed</div>
                <div className="text-xs text-text-secondary">All your exports are clean — no platform branding</div>
              </div>
            </div>
            <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-[10px] font-bold text-success">Active</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-black/5 p-4">
            <div className="flex items-center gap-3">
              {user?.brandLogo ? <Check className="h-5 w-5 text-success" /> : <FileText className="h-5 w-5 text-warning" />}
              <div>
                <div className="text-sm font-semibold text-text-primary">Your logo on exports</div>
                <div className="text-xs text-text-secondary">
                  {user?.brandLogo ? "Your logo will appear on all exported ads" : "Upload a logo in Brand Kit to enable"}
                </div>
              </div>
            </div>
            {user?.brandLogo ? (
              <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-[10px] font-bold text-success">Active</span>
            ) : (
              <Link href="/settings/brand" className="text-xs font-semibold text-primary hover:underline">Set up</Link>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-black/5 p-4">
            <div className="flex items-center gap-3">
              {user?.businessName ? <Check className="h-5 w-5 text-success" /> : <FileText className="h-5 w-5 text-warning" />}
              <div>
                <div className="text-sm font-semibold text-text-primary">Brand name attribution</div>
                <div className="text-xs text-text-secondary">
                  {user?.businessName ? `Exports attributed to "${user.businessName}"` : "Add your business name in Brand Kit"}
                </div>
              </div>
            </div>
            {user?.businessName ? (
              <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-[10px] font-bold text-success">Active</span>
            ) : (
              <Link href="/settings/brand" className="text-xs font-semibold text-primary hover:underline">Set up</Link>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">How it works:</strong> When you download or auto-post an ad, your logo replaces the Famousli watermark. Your business name appears in the metadata. Clients and customers never see Famousli — it looks like your own production.
        </p>
      </div>
    </div>
  );
}
