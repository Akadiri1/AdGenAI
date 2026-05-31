import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const providers = [
    { name: "groq", priority: 1, status: "online" },
    { name: "siliconflow", priority: 2, status: "online" },
    { name: "replicate", priority: 3, status: "online" },
    { name: "elevenlabs", priority: 4, status: "online" },
    { name: "stripe", priority: 5, status: "online" },
    { name: "paystack", priority: 6, status: "online" }
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
