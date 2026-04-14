import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { ReferralClaimer } from "@/components/ReferralClaimer";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { CreditsProvider } from "@/components/CreditsProvider";
import { SupportBubble } from "@/components/SupportBubble";
import { AppLock } from "@/components/AppLock";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Require authentication for ALL dashboard routes
  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true, plan: true, name: true, email: true, isSuspended: true },
  });

  // Session exists but DB record doesn't (deleted user) — sign them out
  if (!user) {
    redirect("/auth/login?error=AccountDeleted");
  }

  if (user.isSuspended) redirect("/suspended");

  const credits = user.credits;
  const plan = user.plan;
  const userName = user.name ?? user.email?.split("@")[0] ?? "User";

  return (
    <CreditsProvider initialCredits={credits}>
      <AppLock>
        <div className="flex h-screen overflow-hidden bg-bg-secondary/20">
          <ReferralClaimer />
          <OnboardingTour />
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar plan={plan} userName={userName} />
            <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:p-6 pb-20 md:pb-6">{children}</main>
          </div>
          <BottomNav />
          <SupportBubble />
        </div>
      </AppLock>
    </CreditsProvider>
  );
}
