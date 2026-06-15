import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function fix() {
  await prisma.ad.updateMany({
    where: { finalVideoStatus: 'GENERATING' },
    data: { finalVideoStatus: null }
  });
  console.log("Ad reset successfully. Ready to retry.");
}
fix().finally(() => prisma.$disconnect());
