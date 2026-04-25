import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkBrandKit } from "@/lib/brandCheck";
import { prisma } from "@/lib/prisma";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { SuccessCelebration } from "@/components/SuccessCelebration";
import {
  Film, Sparkles, Gift, Paintbrush, ChevronRight, AlertTriangle, ShieldCheck,
  CreditCard, User2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let brandComplete = true;
  let brandMissing: string[] = [];
  let brandPercentage = 100;

  let isAdmin = false;
  let credits = 0;
  let totalAds = 0;
  let readyAds = 0;
  let draftAds = 0;
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const check = await checkBrandKit(session.user.id);
    brandComplete = check.complete;
    brandMissing = check.missing;
    brandPercentage = check.percentage;

    const [u, adsCount, ready, draft] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isAdmin: true, credits: true },
      }),
      prisma.ad.count({ where: { userId: session.user.id } }),
      prisma.ad.count({ where: { userId: session.user.id, status: "READY" } }),
      prisma.ad.count({ where: { userId: session.user.id, status: "DRAFT" } }),
    ]);
    isAdmin = u?.isAdmin ?? false;
    credits = u?.credits ?? 0;
    totalAds = adsCount;
    readyAds = ready;
    draftAds = draft;
  }

  // Only metrics we actually have. Impressions/Revenue removed — we don't measure ad performance.
  const stats = [
    {
      label: "Available Credits",
      value: credits.toLocaleString(),
      icon: Sparkles,
      color: "text-primary bg-primary/10",
      cta: { label: "Create Ad", href: "/create" },
    },
    { label: "Total Ads", value: totalAds.toLocaleString(), icon: Film, color: "text-secondary bg-secondary/10" },
    { label: "Drafts (in Studio)", value: draftAds.toLocaleString(), icon: Paintbrush, color: "text-warning bg-warning/10" },
    { label: "Ready to Publish", value: readyAds.toLocaleString(), icon: ShieldCheck, color: "text-success bg-success/10" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SuccessCelebration />
      
      {/* Admin shortcut */}
      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center gap-3 rounded-2xl border-2 border-danger/30 bg-gradient-to-r from-danger/10 via-danger/5 to-transparent p-4 hover:border-danger/50 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-heading font-bold text-text-primary">Super Admin Dashboard</div>
            <div className="text-xs text-text-secondary">Platform metrics, finance audit, live activity</div>
          </div>
          <ChevronRight className="h-5 w-5 text-text-secondary" />
        </Link>
      )}

      {/* Brand Kit incomplete banner */}
      {!brandComplete && (
        <div className="rounded-2xl border-2 border-warning/30 bg-gradient-to-r from-warning/10 via-warning/5 to-transparent p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-warning text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-text-primary mb-1 text-sm sm:text-base">
                Complete your Brand Kit to start creating ads
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary mb-3">
                Fill in: <strong className="text-text-primary">{brandMissing.join(", ")}</strong>
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Link
                  href="/settings/brand"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-warning px-5 text-sm font-semibold text-white hover:bg-warning/90 transition-colors"
                >
                  <Paintbrush className="h-4 w-4" />
                  Complete Brand Kit
                </Link>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <div className="h-1.5 w-24 rounded-full bg-bg-secondary overflow-hidden">
                    <div className="h-full bg-warning rounded-full" style={{ width: `${brandPercentage}%` }} />
                  </div>
                  {brandPercentage}% done
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl sm:rounded-3xl gradient-bg animate-gradient p-5 sm:p-8 md:p-10 text-white">
        <h2 className="font-heading text-2xl font-bold md:text-3xl mb-2">
          {brandComplete ? "Ready to create your next ad?" : "Almost there!"}
        </h2>
        <p className="text-white/90 mb-6 max-w-xl">
          {brandComplete
            ? "Pick an actor, write or AI-generate a script, upload your product. We handle the video, voiceover, and lip-sync. Download the MP4 and post it yourself."
            : "Complete your Brand Kit first — then AI will generate ads tailored to your brand, audience, and voice."}
        </p>
        <div className="flex flex-wrap gap-3">
          {brandComplete ? (
            <Link
              href="/create"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-primary transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Sparkles className="h-4 w-4" />
              Create Ad Draft
            </Link>
          ) : (
            <Link
              href="/settings/brand"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-primary transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Paintbrush className="h-4 w-4" />
              Set up Brand Kit
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {stat.cta && (
                  <Link
                    href={stat.cta.href}
                    className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/5 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    {stat.cta.label} →
                  </Link>
                )}
              </div>
              <div className="font-heading text-2xl font-bold text-text-primary">
                {stat.value}
              </div>
              <div className="text-sm text-text-secondary">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Live activity feed — user's records as they happen */}
      <LiveActivityFeed compact />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold text-text-primary">Recent Ads</h3>
            <Link href="/ads" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-secondary">
              <Film className="h-8 w-8 text-text-secondary" />
            </div>
            <p className="font-heading font-semibold text-text-primary mb-1">No ads yet</p>
            <p className="text-sm text-text-secondary mb-4">
              {brandComplete ? "Create your first ad in 30 seconds" : "Complete your Brand Kit first"}
            </p>
            <Link
              href="/create"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              {brandComplete ? "Create ad" : "Set up Brand Kit"}
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <h3 className="font-heading text-lg font-bold text-text-primary mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { icon: Sparkles, label: "Create a new ad", href: "/create", highlight: brandComplete },
              { icon: Paintbrush, label: brandComplete ? "Update brand kit" : "Complete brand kit (required)", href: "/settings/brand", highlight: !brandComplete },
              { icon: Film, label: "View my ads", href: "/ads", highlight: false },
              { icon: CreditCard, label: "Buy credits", href: "/settings/billing", highlight: false },
              { icon: Gift, label: "Invite friends, earn 20%", href: "/referral", highlight: false },
              { icon: User2, label: "Account settings", href: "/settings/account", highlight: false },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition-colors ${
                    action.highlight
                      ? "bg-warning/10 text-warning hover:bg-warning/20"
                      : "text-text-primary hover:bg-bg-secondary"
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    action.highlight ? "bg-warning/20 text-warning" : "bg-bg-secondary text-text-secondary"
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {action.label}
                  <ChevronRight className="ml-auto h-4 w-4 text-text-secondary" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
