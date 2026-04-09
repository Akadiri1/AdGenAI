import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Palette, Wallet, Star } from "lucide-react";
import { TemplateActions } from "@/components/marketplace/TemplateActions";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  "All", "Restaurant", "Fashion", "Tech", "Real Estate", "Fitness", "Beauty", "Education", "E-commerce",
];

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? "All";

  const templates = await prisma.template.findMany({
    where: {
      isPublic: true,
      ...(category !== "All" && { category: category.toLowerCase() }),
    },
    orderBy: [{ usageCount: "desc" }, { rating: "desc" }],
    take: 30,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary">Template Marketplace</h1>
          <p className="text-text-secondary">Proven ad templates from top creators</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          <Wallet className="h-4 w-4 text-primary" />
          <span className="font-semibold text-primary">Sell your own templates — earn per download</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={cat === "All" ? "/marketplace" : `/marketplace?category=${cat}`}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
              category === cat
                ? "border-primary bg-primary text-white"
                : "border-black/10 bg-white text-text-primary hover:bg-bg-secondary"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {templates.length === 0 ? (
        <div className="rounded-3xl border border-black/5 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-secondary"><Palette className="h-8 w-8 text-text-secondary" /></div>
          <h2 className="font-heading text-xl font-bold text-text-primary mb-2">No templates yet</h2>
          <p className="text-text-secondary">Be the first to publish a template in this category</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((t) => (
            <div
              key={t.id}
              className="group overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <Link href={`/marketplace/${t.id}`} className="block">
                <div className="aspect-square bg-bg-secondary">
                  {t.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.thumbnailUrl} alt={t.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><Palette className="h-10 w-10 text-text-secondary" /></div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md bg-bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-text-secondary">
                    {t.category}
                  </span>
                  {t.isPremium && (
                    <span className="rounded-md bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">PRO</span>
                  )}
                </div>
                <h3 className="mb-1 line-clamp-1 font-heading font-bold text-text-primary">{t.name}</h3>
                <p className="mb-3 line-clamp-2 text-sm text-text-secondary">{t.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-text-secondary">
                    <Star className="inline h-3.5 w-3.5 text-warning" /> {t.rating.toFixed(1)} · {t.usageCount.toLocaleString()} uses
                  </div>
                  <div className="font-heading font-bold text-text-primary">
                    {t.price ? `$${t.price.toFixed(0)}` : "Free"}
                  </div>
                </div>
                <TemplateActions
                  templateId={t.id}
                  isPremium={t.isPremium}
                  price={t.price}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
