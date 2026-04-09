import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdDetailClient } from "./AdDetailClient";
import { stringToPlatforms, stringToImages } from "@/lib/adHelpers";

export const dynamic = "force-dynamic";

export default async function AdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-text-secondary">Please log in</p>
        <Link href="/auth/login" className="text-primary font-semibold">Log in</Link>
      </div>
    );
  }

  const [ad, user] = await Promise.all([
    prisma.ad.findUnique({ where: { id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
  ]);
  if (!ad || ad.userId !== session.user.id) notFound();

  const canEdit = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"].includes(user?.plan ?? "FREE");
  const normalized = {
    ...ad,
    platform: stringToPlatforms(ad.platform),
    images: stringToImages(ad.images),
  };
  return (
    <AdDetailClient ad={JSON.parse(JSON.stringify(normalized))} canEdit={canEdit} />
  );
}
