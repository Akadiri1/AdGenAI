import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function check() {
  const jobs = await prisma.faceSwapJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  console.log(JSON.stringify(jobs, null, 2));
}
check().finally(() => prisma.$disconnect());
