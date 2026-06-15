import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function resetAd() {
  await prisma.ad.updateMany({
    where: { finalVideoStatus: 'GENERATING' },
    data: { finalVideoStatus: null }
  });
  console.log("Reset stuck ads.");
}

resetAd().catch(console.error).finally(() => prisma.$disconnect());
