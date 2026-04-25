import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PromptsViewer } from "./PromptsViewer";

export const dynamic = "force-dynamic";

export default async function PromptsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <div className="p-8 text-center"><Link href="/auth/login" className="text-primary">Log in</Link></div>;
  }

  const ad = await prisma.ad.findUnique({
    where: { id },
    include: { scenes: { orderBy: { sceneNumber: "asc" } } },
  });
  if (!ad || ad.userId !== session.user.id) notFound();

  return (
    <PromptsViewer
      ad={JSON.parse(JSON.stringify({
        id: ad.id,
        productName: ad.productName ?? "",
        productOffer: ad.productOffer,
        headline: ad.headline,
        bodyText: ad.bodyText,
        callToAction: ad.callToAction,
        script: ad.script,
        musicGenre: ad.musicGenre,
        scenes: ad.scenes,
      }))}
    />
  );
}
