import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { stringToPlatforms, stringToImages } from "@/lib/adHelpers";
import { StudioClient } from "./StudioClient";
import { StudioScenesPanel } from "./StudioScenesPanel";

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
  const [ads, user, sceneCount] = await Promise.all([
    prisma.ad.findMany({
      where: { id: { in: allIds }, userId: session.user.id },
      orderBy: { score: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, brandColors: true, brandVoice: true, language: true },
    }),
    prisma.scene.count({ where: { adId: id } }),
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

  return (
    <>
      <StudioScenesPanel adId={id} hasScenes={sceneCount > 0} />
      <StudioClient
        ad={JSON.parse(JSON.stringify(normalizedAds.find((a) => a.id === id)!))}
        variants={JSON.parse(JSON.stringify(normalizedAds))}
        isPaid={isPaid}
        brandColors={brandColors}
        brandVoice={user?.brandVoice ?? "professional"}
        userLang={user?.language ?? "en"}
      />
    </>
  );
}
