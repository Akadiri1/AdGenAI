import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { stringToPlatforms, stringToImages } from "@/lib/adHelpers";
import { StudioClient } from "./StudioClient";
import { StudioScenesPanel } from "./StudioScenesPanel";
import { StudioBriefPanel } from "./StudioBriefPanel";
import { FinalVideoPanel } from "./FinalVideoPanel";

export const dynamic = "force-dynamic";

export default async function StudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ variants?: string }>;
}) {
  const { id } = await params;
  const { variants: variantParam } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-text-secondary">Please log in</p>
        <Link href="/auth/login" className="text-primary font-semibold">Log in</Link>
      </div>
    );
  }

  // Load main ad + any sibling variants + scene count for the new ecommerce flow
  const allIds = [id, ...(variantParam?.split(",").filter(Boolean) ?? [])];
  const [ads, user, sceneCount, ecomAd] = await Promise.all([
    prisma.ad.findMany({
      where: { id: { in: allIds }, userId: session.user.id },
      orderBy: { score: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, brandColors: true, brandVoice: true, language: true },
    }),
    prisma.scene.count({ where: { adId: id } }),
    // Ecommerce-specific load (with actor) — only used if scenes exist
    prisma.ad.findUnique({
      where: { id },
      include: { actor: true },
    }),
  ]);

  const mainAd = ads.find((a) => a.id === id);
  if (!mainAd) notFound();

  const isPaid = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"].includes(user?.plan ?? "FREE");
  let brandColors = { primary: "#FF6B35", secondary: "#004E89", accent: "#2EC4B6" };
  try {
    if (user?.brandColors) brandColors = JSON.parse(user.brandColors);
  } catch { /* */ }

  const normalizedAds = ads.map((a) => ({
    ...a,
    platform: stringToPlatforms(a.platform),
    images: stringToImages(a.images),
  }));

  const briefAd = ecomAd && sceneCount > 0
    ? {
        id: ecomAd.id,
        status: ecomAd.status,
        productName: ecomAd.productName,
        productOffer: ecomAd.productOffer,
        productImages: ecomAd.productImages
          ? (() => {
              try { return JSON.parse(ecomAd.productImages) as string[]; } catch { return []; }
            })()
          : [],
        script: ecomAd.script,
        headline: ecomAd.headline,
        bodyText: ecomAd.bodyText,
        callToAction: ecomAd.callToAction,
        visualInstructions: ecomAd.visualInstructions,
        aspectRatio: ecomAd.aspectRatio,
        actor: ecomAd.actor
          ? {
              id: ecomAd.actor.id,
              name: ecomAd.actor.name,
              thumbnailUrl: ecomAd.actor.thumbnailUrl,
              imageUrl: ecomAd.actor.imageUrl,
            }
          : null,
      }
    : null;

  // Ecommerce ads (with scenes) get the new flow: Brief + Scenes only.
  // Legacy image-only ads keep the old StudioClient.
  if (sceneCount > 0 && briefAd) {
    return (
      <div className="mx-auto max-w-5xl">
        <StudioHeader ad={briefAd} />
        <StudioBriefPanel initialAd={briefAd} />
        <StudioScenesPanel adId={id} hasScenes />
        <FinalVideoPanel adId={id} />
      </div>
    );
  }

  return (
    <StudioClient
      ad={JSON.parse(JSON.stringify(normalizedAds.find((a) => a.id === id)!))}
      variants={JSON.parse(JSON.stringify(normalizedAds))}
      isPaid={isPaid}
      brandColors={brandColors}
      brandVoice={user?.brandVoice ?? "professional"}
      userLang={user?.language ?? "en"}
    />
  );
}

function StudioHeader({ ad }: { ad: { status: string; productName: string | null; headline: string | null } }) {
  const statusLabel = ad.status === "DRAFT" ? "Draft" : ad.status === "GENERATING" ? "Generating" : ad.status === "READY" ? "Ready" : ad.status;
  const statusColor = ad.status === "DRAFT" ? "bg-warning/15 text-warning" : ad.status === "GENERATING" ? "bg-accent/15 text-accent" : ad.status === "READY" ? "bg-success/15 text-success" : "bg-bg-secondary text-text-secondary";
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Link href="/ads" className="text-xs text-text-secondary hover:text-text-primary">← My Ads</Link>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary mt-1 truncate">
          {ad.productName || ad.headline || "Untitled ad"}
        </h1>
      </div>
      <span className={`flex-shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${statusColor}`}>
        {statusLabel}
      </span>
    </div>
  );
}
