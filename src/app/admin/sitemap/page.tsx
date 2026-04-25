import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import {
  ExternalLink, Sparkles, Film, Gift, Settings, CreditCard, User2, Lock,
  Paintbrush, HelpCircle, FileText, Users, DollarSign, Activity, Server, Receipt,
  ShieldCheck, LayoutDashboard, Globe, Eye, EyeOff,
} from "lucide-react";

export const dynamic = "force-dynamic";

type RouteEntry = {
  href: string;
  label: string;
  icon: typeof Sparkles;
  status?: "live" | "hidden" | "deprecated" | "legacy";
  note?: string;
};

const SECTIONS: { title: string; description?: string; routes: RouteEntry[] }[] = [
  {
    title: "Public",
    description: "What logged-out visitors see",
    routes: [
      { href: "/", label: "Landing", icon: Globe, status: "live" },
      { href: "/auth/login", label: "Login", icon: Lock, status: "live" },
      { href: "/auth/signup", label: "Sign up", icon: User2, status: "live" },
      { href: "/onboarding", label: "Onboarding tour", icon: HelpCircle, status: "live" },
      { href: "/tools/hook-generator", label: "Hook Generator (free tool)", icon: Sparkles, status: "live" },
      { href: "/privacy", label: "Privacy", icon: FileText, status: "live" },
      { href: "/terms", label: "Terms", icon: FileText, status: "live" },
      { href: "/cookies", label: "Cookies", icon: FileText, status: "live" },
    ],
  },
  {
    title: "User dashboard (live)",
    description: "Active product surface",
    routes: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, status: "live" },
      { href: "/create", label: "Create Ad (UGC creator)", icon: Sparkles, status: "live" },
      { href: "/ads", label: "My Ads", icon: Film, status: "live" },
      { href: "/referral", label: "Referrals (20%)", icon: Gift, status: "live" },
    ],
  },
  {
    title: "Settings",
    routes: [
      { href: "/settings", label: "Settings home", icon: Settings, status: "live" },
      { href: "/settings/account", label: "Account", icon: User2, status: "live" },
      { href: "/settings/billing", label: "Billing & Plan", icon: CreditCard, status: "live" },
      { href: "/settings/brand", label: "Brand Kit", icon: Paintbrush, status: "live" },
      { href: "/settings/security", label: "Security", icon: Lock, status: "live" },
      { href: "/settings/support", label: "Support", icon: HelpCircle, status: "live" },
      { href: "/settings/api", label: "API keys", icon: Server, status: "hidden", note: "Plan claim removed; page exists but no public API yet" },
      { href: "/settings/team", label: "Team", icon: Users, status: "hidden", note: "No team feature built" },
      { href: "/settings/white-label", label: "White label", icon: Paintbrush, status: "hidden", note: "Not built" },
      { href: "/settings/custom-ai", label: "Custom AI", icon: Sparkles, status: "hidden", note: "Not built" },
    ],
  },
  {
    title: "Hidden from nav (kept for legacy / future)",
    description: "Pages that exist but aren't linked in the sidebar yet",
    routes: [
      { href: "/campaigns", label: "Campaigns", icon: Film, status: "hidden", note: "Pre-pivot feature" },
      { href: "/schedule", label: "Schedule", icon: Activity, status: "hidden", note: "Social posting not wired" },
      { href: "/analytics", label: "Analytics", icon: Activity, status: "hidden", note: "No real metrics yet" },
      { href: "/templates", label: "Templates", icon: FileText, status: "hidden", note: "Not curated for ecommerce flow" },
      { href: "/connect", label: "Connect (social)", icon: Globe, status: "hidden", note: "Marked Coming Soon" },
      { href: "/marketplace", label: "Marketplace", icon: Film, status: "hidden", note: "Pre-pivot feature" },
    ],
  },
  {
    title: "Admin",
    description: "Where you are now",
    routes: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, status: "live" },
      { href: "/admin/users", label: "Users", icon: Users, status: "live" },
      { href: "/admin/revenue", label: "Revenue", icon: DollarSign, status: "live" },
      { href: "/admin/finance", label: "Finance & API costs", icon: Receipt, status: "live" },
      { href: "/admin/infrastructure", label: "Infrastructure", icon: Server, status: "live" },
      { href: "/admin/ads", label: "All Ads", icon: Film, status: "live" },
      { href: "/admin/activity", label: "Activity log", icon: Activity, status: "live" },
      { href: "/admin/sitemap", label: "Sitemap (this page)", icon: Eye, status: "live" },
    ],
  },
];

const STATUS_STYLE: Record<NonNullable<RouteEntry["status"]>, string> = {
  live: "bg-success/15 text-success",
  hidden: "bg-warning/15 text-warning",
  deprecated: "bg-danger/15 text-danger",
  legacy: "bg-bg-secondary text-text-secondary",
};

export default async function AdminSitemap() {
  await requireAdmin();

  const totalLive = SECTIONS.flatMap((s) => s.routes).filter((r) => r.status === "live").length;
  const totalHidden = SECTIONS.flatMap((s) => s.routes).filter((r) => r.status === "hidden").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-5 w-5 text-danger" />
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary">Sitemap</h1>
        </div>
        <p className="text-sm text-text-secondary">
          Every page in the platform — jump in to QA. {" "}
          <strong className="text-success">{totalLive} live</strong> · {" "}
          <strong className="text-warning">{totalHidden} hidden</strong>
        </p>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-heading text-lg font-bold text-text-primary">{section.title}</h2>
            {section.description && (
              <p className="text-xs text-text-secondary mt-0.5">{section.description}</p>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {section.routes.map((route) => {
              const Icon = route.icon;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-3 rounded-xl border border-black/5 bg-bg-secondary/30 p-3 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-black/5">
                    <Icon className="h-4 w-4 text-text-secondary group-hover:text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-text-primary">{route.label}</span>
                      {route.status && (
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_STYLE[route.status]}`}>
                          {route.status === "hidden" ? <span className="inline-flex items-center gap-1"><EyeOff className="h-2.5 w-2.5" /> hidden</span> : route.status}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-text-secondary mt-0.5 truncate">{route.href}</div>
                    {route.note && (
                      <div className="text-[10px] text-text-secondary/80 italic mt-1">{route.note}</div>
                    )}
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-text-secondary/50 group-hover:text-primary mt-1" />
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-xs text-text-secondary">
        <strong className="text-text-primary">Hidden</strong> = the page file exists but isn&rsquo;t linked from the user nav. Often means the feature is half-built or deferred. Click any link — it opens in a new tab.
      </div>
    </div>
  );
}
