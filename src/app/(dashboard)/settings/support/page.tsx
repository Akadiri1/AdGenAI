import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Headphones, Lock, Mail, MessageSquare, Calendar, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return <div className="p-8 text-center"><Link href="/auth/login" className="text-primary">Log in</Link></div>;

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true, accountManagerId: true } });

  if (user?.plan !== "ENTERPRISE") {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href="/settings" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-text-secondary"><ArrowLeft className="h-4 w-4" /> Settings</Link>
        <div className="rounded-3xl border-2 border-warning/20 bg-warning/5 p-10 text-center">
          <Lock className="mx-auto h-12 w-12 text-warning mb-4" />
          <h1 className="font-heading text-2xl font-bold text-text-primary mb-2">Dedicated Support</h1>
          <p className="text-text-secondary mb-6">Get a dedicated success manager, priority SLA, and direct line for your team. Enterprise only.</p>
          <Link href="/settings/billing" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-white hover:bg-primary-dark">Upgrade to Enterprise</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary"><ArrowLeft className="h-4 w-4" /> Settings</Link>
      <div>
        <h1 className="font-heading text-3xl font-bold text-text-primary flex items-center gap-3">
          <Headphones className="h-8 w-8 text-danger" /> Dedicated Support
        </h1>
        <p className="text-text-secondary mt-1">Priority access to our team — we&apos;re here to help you succeed</p>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-text-primary mb-4">Your Success Manager</h2>
        <div className="flex items-center gap-4 rounded-xl bg-bg-secondary p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white font-heading text-xl font-bold">
            SM
          </div>
          <div>
            <div className="font-heading font-bold text-text-primary">
              {user.accountManagerId ? "Assigned" : "Being assigned"}
            </div>
            <div className="text-sm text-text-secondary">
              {user.accountManagerId
                ? "Your dedicated success manager is ready to help"
                : "We're assigning a success manager to your account. You'll receive an email within 24 hours."}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <Mail className="h-6 w-6 text-primary mb-3" />
          <div className="font-heading font-bold text-text-primary mb-1">Direct Email</div>
          <p className="text-sm text-text-secondary mb-3">Skip the queue — your emails go straight to your success manager</p>
          <a href="mailto:enterprise@adgenai.com" className="text-sm font-semibold text-primary hover:underline">enterprise@adgenai.com</a>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <MessageSquare className="h-6 w-6 text-accent mb-3" />
          <div className="font-heading font-bold text-text-primary mb-1">Priority Chat</div>
          <p className="text-sm text-text-secondary mb-3">Real-time support with guaranteed &lt;1hr response during business hours</p>
          <span className="text-sm font-semibold text-success">Available now</span>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <Calendar className="h-6 w-6 text-warning mb-3" />
          <div className="font-heading font-bold text-text-primary mb-1">Strategy Calls</div>
          <p className="text-sm text-text-secondary mb-3">Monthly 1-on-1 calls to optimize your ad strategy and campaign performance</p>
          <span className="text-sm font-semibold text-text-secondary">Schedule via your success manager</span>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <Clock className="h-6 w-6 text-danger mb-3" />
          <div className="font-heading font-bold text-text-primary mb-1">SLA Guarantee</div>
          <p className="text-sm text-text-secondary mb-3">99.9% uptime guarantee with priority issue resolution</p>
          <span className="text-sm font-semibold text-success">Active</span>
        </div>
      </div>
    </div>
  );
}
