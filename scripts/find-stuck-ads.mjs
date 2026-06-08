import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const stuckAds = await prisma.ad.findMany({
    where: {
      status: "GENERATING",
      createdAt: { lt: fifteenMinutesAgo }
    },
    orderBy: { createdAt: 'desc' },
    include: { scenes: true }
  });
  
  if (stuckAds.length === 0) {
    console.log("No ads found stuck in GENERATING for > 15 mins.");
  } else {
    console.log(`Found ${stuckAds.length} stuck ads:`);
    stuckAds.forEach(ad => {
      console.log(`- Ad ${ad.id} (Created: ${ad.createdAt})`);
      ad.scenes.forEach(s => {
        console.log(`  - Scene ${s.sceneNumber}: ${s.status} (klingTaskId: ${s.klingTaskId}, lipSyncTaskId: ${s.lipSyncTaskId})`);
      });
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
