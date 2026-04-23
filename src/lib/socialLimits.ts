import { prisma } from "@/lib/prisma";

/**
 * Only PRO, BUSINESS, and ENTERPRISE users can connect social accounts.
 */
export async function canConnectSocialAccount(
  userId: string,
  platform: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  if (!user) return { allowed: false, reason: "User not found" };

  const allowedPlans = ["PRO", "BUSINESS", "ENTERPRISE"];
  if (allowedPlans.includes(user.plan)) return { allowed: true };

  // Allow WhatsApp for all paid plans if it was previously allowed, 
  // but following the strict rule: only Pro+
  
  return {
    allowed: false,
    reason: "Social account connection is a Pro feature. Upgrade to connect your accounts.",
  };
}
