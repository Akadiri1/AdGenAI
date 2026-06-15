import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function check() {
  const ad = await prisma.ad.findFirst({
    where: { finalVideoStatus: 'GENERATING' },
    include: { scenes: true }
  });
  console.log(JSON.stringify(ad, null, 2));
}
check().finally(() => prisma.$disconnect());
