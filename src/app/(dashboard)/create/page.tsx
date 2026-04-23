import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkBrandKit } from "@/lib/brandCheck";
import Link from "next/link";
import { UGCCreatorClient } from "./ugc/UGCCreatorClient";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <div className="p-8 text-center"><Link href="/auth/login" className="text-primary">Log in</Link></div>;
  }

  // If you don't want the brandkit blocking them from using the Arcads-style creator, we can comment this out or keep it.
  // We'll keep it as it's required for AI generation context, but we ensure it doesn't ask for a website URL.
  const brandCheck = await checkBrandKit(session.user.id);
  if (!brandCheck.complete) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-text-primary mb-4">Tell us about your product</h1>
        <p className="text-text-secondary mb-6">Before generating AI videos, we need to know what you're selling. Fill in: {brandCheck.missing.join(", ")}</p>
        <Link href="/settings/brand" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white hover:bg-primary-dark">
          Complete Profile
        </Link>
      </div>
    );
  }

  return <UGCCreatorClient />;
}
