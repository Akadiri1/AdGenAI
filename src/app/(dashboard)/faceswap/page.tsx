import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FaceSwapClient } from "./FaceSwapClient";

export const metadata = {
  title: "AI Face Swap | Famousli",
};

export default async function FaceSwapPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, credits: true },
  });

  if (!user) {
    redirect("/auth/login");
  }

  const isPaid = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"].includes(user.plan);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mb-20 md:mb-0 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
          AI Face Swap <span className="inline-block px-3 py-1 ml-3 text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full align-middle">Pro Feature</span>
        </h1>
        <p className="text-text-secondary mt-2 text-base sm:text-lg max-w-2xl">
          Instantly replace the face in any video. Upload your target video and select a face—our AI maps it frame-by-frame.
        </p>
      </div>

      {!isPaid ? (
        <div className="rounded-3xl border border-accent/20 bg-accent/5 p-8 text-center max-w-2xl mx-auto mt-12">
          <div className="h-16 w-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">Upgrade to Unlock Face Swap</h2>
          <p className="text-text-secondary mb-6">
            Face swapping videos requires heavy AI computing power and is currently only available to users on our paid plans. Upgrade today to unlock full access.
          </p>
          <a href="/settings/billing" className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-8 font-bold text-black hover:bg-accent-hover transition-colors shadow-lg shadow-accent/20">
            Upgrade Plan
          </a>
        </div>
      ) : (
        <FaceSwapClient initialCredits={user.credits} />
      )}
    </div>
  );
}
