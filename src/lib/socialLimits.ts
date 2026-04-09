import { prisma } from "@/lib/prisma";

/**
 * Free users can connect only 1 social account total (+ WhatsApp).
 * PRO/BUSINESS get unlimited.
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

  const paidPlans = ["STARTER", "PRO", "BUSINESS", "ENTERPRISE"];
  if (paidPlans.includes(user.plan)) return { allowed: true };

  // Free users: allow WhatsApp always, limit other platforms to 1 total
  if (platform === "WHATSAPP") return { allowed: true };

  const existingCount = await prisma.socialAccount.count({
    where: { userId, isActive: true, platform: { not: "WHATSAPP" } },
  });

  if (existingCount >= 1) {
    return {
      allowed: false,
      reason: "Free plan allows 1 connected account. Upgrade to Pro to connect more.",
    };
  }

  return { allowed: true };
}
