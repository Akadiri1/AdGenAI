import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  User, CreditCard, Paintbrush, Users, Key, Plug, FileText,
  Crown, Headphones, type LucideIcon,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Section = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  color: string;
  minPlan?: string[];
  badge?: string;
};

const ALL_SECTIONS: Section[] = [
  { label: "Account", href: "/settings/account", icon: User, description: "Profile, email, preferences", color: "text-primary bg-primary/10" },
  { label: "Billing", href: "/settings/billing", icon: CreditCard, description: "Plan, credits, payment history", color: "text-accent bg-accent/10" },
  { label: "Brand Kit", href: "/settings/brand", icon: Paintbrush, description: "Logo, colors, language, voice", color: "text-warning bg-warning/10" },
  { label: "Team", href: "/settings/team", icon: Users, description: "Invite members, assign roles", color: "text-secondary bg-secondary/10", minPlan: ["BUSINESS", "ENTERPRISE"] },
  { label: "API Keys", href: "/settings/api", icon: Key, description: "Manage API access", color: "text-success bg-success/10", minPlan: ["BUSINESS", "ENTERPRISE"] },
  { label: "Integrations", href: "/connect", icon: Plug, description: "Connected social accounts", color: "text-primary bg-primary/10" },
  { label: "White Label", href: "/settings/white-label", icon: FileText, description: "Custom branding on exports", color: "text-accent bg-accent/10", minPlan: ["BUSINESS", "ENTERPRISE"], badge: "Business+" },
  { label: "Custom AI", href: "/settings/custom-ai", icon: Crown, description: "AI model trained on your brand", color: "text-warning bg-warning/10", minPlan: ["ENTERPRISE"], badge: "Enterprise" },
  { label: "Support", href: "/settings/support", icon: Headphones, description: "Dedicated success manager", color: "text-danger bg-danger/10", minPlan: ["ENTERPRISE"], badge: "Enterprise" },
];

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  let plan = "FREE";
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
    plan = user?.plan ?? "FREE";
  }

  // Show all sections — locked ones show upgrade prompt
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-3xl font-bold text-text-primary mb-6">Settings</h1>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {ALL_SECTIONS.map((s) => {
          const Icon = s.icon;
          const hasAccess = !s.minPlan || s.minPlan.includes(plan);
          return (
            <Link
              key={s.href}
              href={hasAccess ? s.href : "/settings/billing"}
              className={`relative rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${
                !hasAccess ? "opacity-60" : ""
              }`}
            >
              {s.badge && (
                <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                  hasAccess ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                }`}>
                  {hasAccess ? "Active" : s.badge}
                </span>
              )}
              <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="font-heading font-bold text-text-primary mb-1">{s.label}</div>
              <div className="text-sm text-text-secondary">{s.description}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
