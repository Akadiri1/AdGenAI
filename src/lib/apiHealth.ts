import { prisma } from "./prisma";

export async function logApiHealth(name: string, success: boolean, error?: string) {
  try {
    await prisma.apiProvider.upsert({
      where: { name },
      update: {
        lastUsedAt: new Date(),
        ...(success 
          ? { lastSuccessAt: new Date(), status: "online", errorCount: 0, lastError: null }
          : { status: "degraded", lastError: error, errorCount: { increment: 1 } }
        ),
      },
      create: {
        name,
        status: success ? "online" : "degraded",
        lastSuccessAt: success ? new Date() : null,
        lastError: error,
        errorCount: success ? 0 : 1,
      },
    });

    // If error count gets too high, mark as offline
    if (!success) {
      const updated = await prisma.apiProvider.findUnique({ where: { name } });
      if (updated && updated.errorCount >= 5) {
        await prisma.apiProvider.update({
          where: { name },
          data: { status: "offline" }
        });
      }
    }
  } catch (e) {
    console.error("Failed to log API health:", e);
  }
}
