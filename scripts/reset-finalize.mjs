/**
 * Reset a stuck finalVideoStatus so the user can retry.
 * Run: node scripts/reset-finalize.mjs <adId>
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const adId = process.argv[2];
if (!adId) {
  // Reset all stuck ones
  const updated = await prisma.ad.updateMany({
    where: { finalVideoStatus: "GENERATING" },
    data: { finalVideoStatus: null, finalVideoError: "Reset — was stuck in GENERATING" },
  });
  console.log(`Reset ${updated.count} stuck ad(s)`);
} else {
  await prisma.ad.update({
    where: { id: adId },
    data: { finalVideoStatus: null, finalVideoError: "Manually reset" },
  });
  console.log(`Reset ad ${adId}`);
}
await prisma.$disconnect();
