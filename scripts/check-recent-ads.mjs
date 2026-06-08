import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const ads = await prisma.ad.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { scenes: true }
  });
  console.log(JSON.stringify(ads, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
