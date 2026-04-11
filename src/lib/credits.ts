import { prisma } from "@/lib/prisma";

export const COSTS = {
  MAGIC_CAMPAIGN: 1,
  IMAGE_AD: 1,
  VIDEO_AD: 2,
  CAROUSEL: 2,
  TALKING_ACTOR: 3,
} as const;

export type CostKey = keyof typeof COSTS;

export async function checkCredits(userId: string, cost: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true, creditsExpiry: true },
  });
  if (!user) return false;
  if (user.creditsExpiry && user.creditsExpiry < new Date()) return false;
  return user.credits >= cost;
}

export async function deductCredits(userId: string, cost: number): Promise<number> {
  const result = await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: cost } },
    select: { credits: true },
  });
  return result.credits;
}

export async function addCredits(userId: string, amount: number): Promise<number> {
  const result = await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: amount } },
    select: { credits: true },
  });
  return result.credits;
}
