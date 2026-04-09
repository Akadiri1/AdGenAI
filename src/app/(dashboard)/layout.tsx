import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { ReferralClaimer } from "@/components/ReferralClaimer";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { CreditsProvider } from "@/components/CreditsProvider";
import { SupportBubble } from "@/components/SupportBubble";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  let credits = 0;
  let plan = "FREE";
  let userName = "User";

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true, plan: true, name: true, email: true },
    });
    if (user) {
      credits = user.credits;
      plan = user.plan;
      userName = user.name ?? user.email?.split("@")[0] ?? "User";
    }
  }

  return (
    <CreditsProvider initialCredits={credits}>
      <div className="flex h-screen overflow-hidden bg-bg-secondary/20">
        <ReferralClaimer />
        <OnboardingTour />
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar plan={plan} userName={userName} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-6">{children}</main>
        </div>
        <BottomNav />
        <SupportBubble />
      </div>
    </CreditsProvider>
  );
}
