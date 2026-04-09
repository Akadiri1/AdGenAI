import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Lock, Sparkles, ArrowLeft } from "lucide-react";
import { AdvancedModeClient } from "./AdvancedModeClient";

export const dynamic = "force-dynamic";

export default async function AdvancedModePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-text-secondary">Please log in</p>
        <Link href="/auth/login" className="text-primary font-semibold">Log in</Link>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  const isPaid = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"].includes(user?.plan ?? "FREE");

  if (!isPaid) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/create"
          className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-warning/5 to-accent/5 p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">
            Advanced Mode is a Pro feature
          </h1>
          <p className="text-text-secondary mb-6 max-w-md mx-auto leading-relaxed">
            Write your own copy and scripts, upload custom images, choose music genres,
            and tune every platform — all in Advanced Mode.
          </p>

          <div className="mb-6 grid gap-2 text-sm text-left max-w-sm mx-auto">
            {[
              "Manual headline, body, and CTA editing",
              "5 proven copy frameworks (AIDA, PAS, BAB, 4U, FAB)",
              "Custom image upload or AI prompt",
              "12 music genres including afrobeats, cinematic, lo-fi",
              "Per-platform aspect ratio control",
              "Edit ads after creation",
              "No watermark on exports",
            ].map((f) => (
              <div key={f} className="flex items-start gap-2 text-text-secondary">
                <svg className="h-4 w-4 flex-shrink-0 text-success mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {f}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/settings/billing"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg"
            >
              Upgrade to Starter — $49/mo
            </Link>
            <Link
              href="/create/magic"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-black/10 bg-white px-6 font-semibold text-text-primary transition-all hover:bg-bg-secondary"
            >
              <Sparkles className="h-4 w-4" />
              Use Magic Mode (free)
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <AdvancedModeClient />;
}
