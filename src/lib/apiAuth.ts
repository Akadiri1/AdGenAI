import { prisma } from "@/lib/prisma";

/**
 * Validates an API key from the Authorization header.
 * Returns the user ID if valid, null otherwise.
 * Also increments usage count and updates lastUsedAt.
 */
export async function validateApiKey(req: Request): Promise<{
  userId: string;
  keyId: string;
} | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer adg_")) return null;

  const key = auth.replace("Bearer ", "");

  const apiKey = await prisma.apiKey.findUnique({ where: { key } });
  if (!apiKey || !apiKey.isActive) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Update usage stats (fire and forget)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date(), usageCount: { increment: 1 } },
  }).catch(() => {});

  return { userId: apiKey.userId, keyId: apiKey.id };
}
