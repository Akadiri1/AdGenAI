import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const providers = [
    { name: "qwen", priority: 1, status: "online" },
    { name: "replicate", priority: 2, status: "online" },
  ];

  for (const p of providers) {
    await prisma.apiProvider.upsert({
      where: { name: p.name },
      update: p,
      create: p,
    });
  }
  console.log("Providers seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
