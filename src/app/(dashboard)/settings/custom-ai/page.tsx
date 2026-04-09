import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Crown, Lock, Brain, TrendingUp, Sparkles, Database } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomAIPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return <div className="p-8 text-center"><Link href="/auth/login" className="text-primary">Log in</Link></div>;

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });

  if (user?.plan !== "ENTERPRISE") {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href="/settings" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-text-secondary"><ArrowLeft className="h-4 w-4" /> Settings</Link>
        <div className="rounded-3xl border-2 border-warning/20 bg-warning/5 p-10 text-center">
          <Lock className="mx-auto h-12 w-12 text-warning mb-4" />
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">Custom AI Model</h1>
          <p className="text-text-secondary mb-6">Train a custom AI model on your brand voice, past ads, and performance data. Enterprise only.</p>
          <Link href="/settings/billing" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white hover:bg-primary-dark">Upgrade to Enterprise</Link>
        </div>
      </div>
    );
  }

  const adCount = await prisma.ad.count({ where: { userId: session.user.id } });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary"><ArrowLeft className="h-4 w-4" /> Settings</Link>
      <div>
        <h1 className="font-heading text-3xl font-bold text-text-primary flex items-center gap-3">
          <Crown className="h-8 w-8 text-warning" /> Custom AI Model
        </h1>
        <p className="text-text-secondary mt-1">AI that learns your brand and gets better with every ad you create</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <Brain className="h-8 w-8 text-primary mb-3" />
          <div className="font-heading font-bold text-text-primary mb-1">Brand Voice Learning</div>
          <p className="text-sm text-text-secondary">AI analyzes your past {adCount} ads to match your exact tone, vocabulary, and messaging style</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <TrendingUp className="h-8 w-8 text-success mb-3" />
          <div className="font-heading font-bold text-text-primary mb-1">Performance Optimization</div>
          <p className="text-sm text-text-secondary">AI prioritizes copy patterns, hooks, and CTAs that scored highest in your ad history</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <Sparkles className="h-8 w-8 text-accent mb-3" />
          <div className="font-heading font-bold text-text-primary mb-1">Auto-Improving</div>
          <p className="text-sm text-text-secondary">Every ad you create feeds back into the model — it gets smarter over time automatically</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <Database className="h-8 w-8 text-warning mb-3" />
          <div className="font-heading font-bold text-text-primary mb-1">Training Data</div>
          <p className="text-sm text-text-secondary">{adCount} ads created · Brand Kit data · Performance scores · User preferences</p>
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-text-primary mb-4">Model Status</h2>
        <div className="flex items-center justify-between rounded-xl bg-success/10 border border-success/20 p-4">
          <div>
            <div className="font-heading font-bold text-success">Active & Learning</div>
            <div className="text-xs text-text-secondary mt-1">Your custom AI context is injected into every ad generation automatically</div>
          </div>
          <div className="text-right">
            <div className="font-heading text-2xl font-bold text-text-primary">{adCount}</div>
            <div className="text-xs text-text-secondary">ads trained on</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">How it works:</strong> Every time you generate an ad, AI reads your business description, target audience, brand voice, colors, tagline, and your top-performing past ads. It uses these to match your style, prioritize what works, and avoid what doesn&apos;t. The more ads you create, the better it gets.
        </p>
      </div>
    </div>
  );
}
