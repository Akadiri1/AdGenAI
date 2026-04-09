import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sparkles, Sliders, Lock, Film, User2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const session = await getServerSession(authOptions);
  let isPaid = false;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });
    isPaid = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"].includes(user?.plan ?? "FREE");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-3xl font-bold text-text-primary mb-2">Create an Ad</h1>
      <p className="text-text-secondary mb-8">Choose how much control you want</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/create/magic"
          className="group relative overflow-hidden rounded-3xl border-2 border-primary bg-gradient-to-br from-primary/5 via-warning/5 to-accent/5 p-8 transition-all hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">Magic Mode</h2>
          <p className="text-text-secondary mb-4 leading-relaxed">
            Type your business in one sentence. AI handles copy, images, video, music, and scheduling. Zero decisions.
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            Free · recommended for beginners
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </Link>

        <Link
          href="/create/advanced"
          className="group relative rounded-3xl border-2 border-black/10 bg-white p-8 transition-all hover:-translate-y-1 hover:border-black/20 hover:shadow-lg"
        >
          {!isPaid && (
            <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-warning">
              <Lock className="h-3 w-3" /> Pro
            </div>
          )}
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-secondary text-text-primary">
            <Sliders className="h-5 w-5" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">Advanced Mode</h2>
          <p className="text-text-secondary mb-4 leading-relaxed">
            Manual copy, custom uploads, choose music, edit scripts, and tune every detail.
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
            For marketers & agencies
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </Link>

      </div>
    </div>
  );
}
