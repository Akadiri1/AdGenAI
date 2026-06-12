import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const scenes = await prisma.scene.findMany({
    where: {
      status: 'READY'
    },
    select: {
      id: true,
      sceneNumber: true,
      videoClipUrl: true,
      voiceoverUrl: true,
      lipSyncTaskId: true,
      finalClipUrl: true,
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  })
  
  console.log("Recent READY scenes:");
  console.log(JSON.stringify(scenes, null, 2));

  const ads = await prisma.ad.findMany({
    where: {
      finalVideoStatus: 'GENERATING'
    },
    select: {
      id: true,
      finalVideoStatus: true
    }
  });
  console.log("\nAds stuck in GENERATING:");
  console.log(ads);
}

main().catch(console.error).finally(() => prisma.$disconnect())
