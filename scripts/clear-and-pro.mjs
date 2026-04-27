import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    data: { 
      plan: "PRO", 
      credits: 500 
    },
  });

  console.log(`Successfully upgraded ${result.count} user(s) to PRO plan.`);
  console.log(`Tokens (credits) have been set to 500.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
