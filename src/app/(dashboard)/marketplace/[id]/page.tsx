import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft, User, Star, Download, Eye, Type,
  Music, Image as ImageIcon, Layers, Film,
} from "lucide-react";
import { TemplateActions } from "@/components/marketplace/TemplateActions";

export const dynamic = "force-dynamic";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const template = await prisma.template.findUnique({
    where: { id },
    include: { creator: { select: { name: true, businessName: true } } },
  });
  if (!template || !template.isPublic) notFound();

  let config: Record<string, string | null> = {};
  try {
    config = JSON.parse(template.config);
  } catch { /* */ }

  // Check if current user already purchased
  let hasPurchased = false;
  const isOwner = session?.user?.id === template.creatorId;
  if (session?.user?.id && template.isPremium) {
    const purchase = await prisma.transaction.findFirst({
      where: {
        userId: session.user.id,
        type: "template_purchase",
        providerId: template.id,
        status: "completed",
      },
    });
    hasPurchased = !!purchase;
  }

  const canSeeFullContent = !template.isPremium || hasPurchased || isOwner;
  const creatorName = template.creator?.businessName ?? template.creator?.name ?? "Anonymous";

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/marketplace"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </Link>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-20 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
              <div className="aspect-square bg-bg-secondary">
                {template.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={template.thumbnailUrl} alt={template.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Film className="h-12 w-12 text-text-secondary" />
                  </div>
                )}
              </div>
            </div>

            {/* Buy / Use button */}
            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              {hasPurchased && (
                <div className="mb-3 rounded-xl bg-success/10 border border-success/20 p-2 text-center text-xs font-semibold text-success">
                  You own this template
                </div>
              )}
              <TemplateActions
                templateId={template.id}
                isPremium={template.isPremium && !hasPurchased && !isOwner}
                price={template.price}
              />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-md bg-bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-text-secondary">
                    {template.category}
                  </span>
                  <span className="rounded-md bg-bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-text-secondary">
                    {template.adType}
                  </span>
                  {template.isPremium && (
                    <span className="rounded-md bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">
                      {template.price} credits
                    </span>
                  )}
                </div>
                <h1 className="font-heading text-2xl font-bold text-text-primary">{template.name}</h1>
              </div>
            </div>

            {template.description && (
              <p className="text-text-secondary leading-relaxed mb-4">{template.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" /> {creatorName}
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-warning" /> {template.rating.toFixed(1)}
              </div>
              <div className="flex items-center gap-1.5">
                <Download className="h-4 w-4" /> {template.usageCount.toLocaleString()} uses
              </div>
            </div>
          </div>

          {/* Template contents — visible to buyers + owner, blurred for non-buyers */}
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="font-heading font-bold text-text-primary mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5" /> What&apos;s included
            </h2>

            <div className={`space-y-4 ${!canSeeFullContent ? "relative" : ""}`}>
              {!canSeeFullContent && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="font-heading font-bold text-text-primary mb-1">Purchase to see full contents</div>
                    <p className="text-xs text-text-secondary mb-3">Buy this template to preview all copy, framework, and music details</p>
                  </div>
                </div>
              )}

              <ContentRow
                icon={Type}
                label="Headline"
                value={canSeeFullContent ? (config.headline ?? "—") : "••••••••••••••"}
              />
              <ContentRow
                icon={Type}
                label="Body text"
                value={canSeeFullContent ? (config.bodyText ?? "—") : "••••••••••••••••••••••••••"}
              />
              <ContentRow
                icon={Type}
                label="Call to action"
                value={canSeeFullContent ? (config.callToAction ?? "—") : "••••••••"}
              />
              {config.script && (
                <ContentRow
                  icon={Film}
                  label="Video script"
                  value={canSeeFullContent ? config.script : "••••••••••••••••••••••••••••••••••••••"}
                />
              )}
              {config.scriptFramework && (
                <ContentRow
                  icon={Layers}
                  label="Framework"
                  value={canSeeFullContent ? config.scriptFramework : "••••"}
                />
              )}
              {config.musicGenre && (
                <ContentRow
                  icon={Music}
                  label="Music genre"
                  value={canSeeFullContent ? config.musicGenre : "••••••"}
                />
              )}
              <ContentRow
                icon={ImageIcon}
                label="Aspect ratio"
                value={config.aspectRatio ?? "1:1"}
              />
            </div>
          </div>

          {/* What you get */}
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
            <h3 className="font-heading font-bold text-text-primary mb-2">What you get</h3>
            <ul className="space-y-1.5 text-sm text-text-secondary">
              <li>• Full copy (headline, body, CTA) ready to use</li>
              <li>• Pre-configured platform targeting</li>
              <li>• Music genre and aspect ratio pre-set</li>
              <li>• Opens in Studio — edit everything before publishing</li>
              <li>• Your brand colors and voice applied automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-bg-secondary text-text-secondary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{label}</div>
        <div className="text-sm text-text-primary mt-0.5">{value}</div>
      </div>
    </div>
  );
}
