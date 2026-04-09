import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  UtensilsCrossed,
  Shirt,
  Monitor,
  Home,
  Dumbbell,
  Sparkle,
  GraduationCap,
  ShoppingCart,
  Plane,
  Palette,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const INDUSTRIES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
  { key: "fashion", label: "Fashion", icon: Shirt },
  { key: "tech", label: "Tech / SaaS", icon: Monitor },
  { key: "real-estate", label: "Real Estate", icon: Home },
  { key: "fitness", label: "Fitness", icon: Dumbbell },
  { key: "beauty", label: "Beauty", icon: Sparkle },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "e-commerce", label: "E-commerce", icon: ShoppingCart },
  { key: "travel", label: "Travel", icon: Plane },
];

export default async function TemplatesPage() {
  const featured = await prisma.template.findMany({
    where: { isPublic: true },
    orderBy: { usageCount: "desc" },
    take: 8,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-text-primary">Templates</h1>
        <p className="text-text-secondary">Start from a proven template, tailored to your industry</p>
      </div>

      <div>
        <h2 className="font-heading text-xl font-bold text-text-primary mb-4">Browse by industry</h2>
        <div className="grid gap-3 grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
          {INDUSTRIES.map((ind) => (
            <Link
              key={ind.key}
              href={`/marketplace?category=${ind.label}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-white p-4 transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <ind.icon className="h-8 w-8 text-text-secondary" />
              <span className="text-xs font-semibold text-text-primary text-center">{ind.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-text-primary">Most popular</h2>
          <Link href="/marketplace" className="text-sm font-semibold text-primary hover:underline">
            Browse all →
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="rounded-3xl border border-black/5 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-secondary"><Palette className="h-8 w-8 text-text-secondary" /></div>
            <p className="font-heading font-semibold text-text-primary mb-2">No templates yet</p>
            <p className="text-sm text-text-secondary">Check back soon — creators are building</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((t) => (
              <div key={t.id} className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
                <div className="aspect-square bg-bg-secondary" />
                <div className="p-4">
                  <h3 className="font-heading font-bold text-text-primary">{t.name}</h3>
                  <p className="text-xs text-text-secondary">{t.usageCount.toLocaleString()} uses</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
