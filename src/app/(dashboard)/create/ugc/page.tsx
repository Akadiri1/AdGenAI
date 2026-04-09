import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkBrandKit } from "@/lib/brandCheck";
import Link from "next/link";
import { UGCCreatorClient } from "./UGCCreatorClient";

export const dynamic = "force-dynamic";

export default async function UGCCreatorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <div className="p-8 text-center"><Link href="/auth/login" className="text-primary">Log in</Link></div>;
  }

  const brandCheck = await checkBrandKit(session.user.id);
  if (!brandCheck.complete) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-text-primary mb-4">Complete your Brand Kit first</h1>
        <p className="text-text-secondary mb-6">Fill in: {brandCheck.missing.join(", ")}</p>
        <Link href="/settings/brand" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white hover:bg-primary-dark">
          Complete Brand Kit
        </Link>
      </div>
    );
  }

  return <UGCCreatorClient />;
}
