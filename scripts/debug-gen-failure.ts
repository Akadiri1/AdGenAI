import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const providers = await prisma.apiProvider.findMany();
  console.log("Providers Status:", JSON.stringify(providers, null, 2));

  const logs = await prisma.auditLog.findMany({
    where: { 
      OR: [
        { action: { contains: "fail" } },
        { action: "ad_edited" }
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 5
  });
  console.log("Recent Logs:", JSON.stringify(logs, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
