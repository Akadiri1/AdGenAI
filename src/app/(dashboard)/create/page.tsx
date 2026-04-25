import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkBrandKit } from "@/lib/brandCheck";
import Link from "next/link";
import { EcommerceCreator } from "./EcommerceCreator";
import { canGenerateVideo, type PlanKey } from "@/lib/plans";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <div className="p-8 text-center"><Link href="/auth/login" className="text-primary">Log in</Link></div>;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  const plan = (user?.plan ?? "FREE") as PlanKey;
  const isPaid = canGenerateVideo(plan);
  const isFree = plan === "FREE";

  // Brand kit only required for paid users — free users just need a product name
  if (isPaid) {
    const brandCheck = await checkBrandKit(session.user.id);
    if (!brandCheck.complete) {
      return (
        <div className="mx-auto max-w-2xl p-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-4">Tell us about your brand first</h1>
          <p className="text-text-secondary mb-6">
            Before generating videos, the AI needs to know your business so it matches your style.
            Fill in: {brandCheck.missing.join(", ")}
          </p>
          <Link href="/settings/brand" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white hover:bg-primary-dark">
            Complete Brand Kit
          </Link>
        </div>
      );
    }
  }

  return <EcommerceCreator isPaid={isPaid} isFree={isFree} />;
}
