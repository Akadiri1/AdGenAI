import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const failedScenes = await prisma.scene.findMany({
    where: { status: "FAILED" },
    include: { ad: { include: { actor: true } } }
  });

  const toRefund = failedScenes.filter(s => {
    const actorUrl = s.ad.actor?.imageUrl;
    const isLocal = actorUrl?.includes("localhost") || actorUrl?.includes("127.0.0.1");
    // Only refund if it looks like a connectivity failure (MoviePy or specific hint)
    const isConnErr = s.editInstructions?.includes("MoviePy") || 
                     s.editInstructions?.includes("Connectivity Error") || 
                     s.editInstructions?.includes("failed to read the first frame") ||
                     s.editInstructions?.toLowerCase().includes("fetch");
    return isLocal && isConnErr && !s.editInstructions?.startsWith("Refunded");
  });

  console.log(`Found ${toRefund.length} failed scenes likely due to localhost connectivity.`);

  const refundsByUser = {};

  for (const scene of toRefund) {
    const cost = scene.durationSeconds + 3; // base cost + overhead
    refundsByUser[scene.ad.userId] = (refundsByUser[scene.ad.userId] || 0) + cost;
    
    // Mark as refunded
    await prisma.scene.update({
      where: { id: scene.id },
      data: { editInstructions: `Refunded: ${scene.editInstructions}` }
    });
  }

  for (const [userId, amount] of Object.entries(refundsByUser)) {
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } }
    });
    console.log(`Refunded ${amount} credits to user ${userId}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
