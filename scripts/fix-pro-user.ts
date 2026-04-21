import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "akadiriokiki@gmail.com" }
  });

  if (user) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { 
        plan: "PRO",
        credits: 80 
      }
    });
    console.log(`Updated user ${user.email} to PRO plan with ${updated.credits} credits.`);
  } else {
    console.log("User not found.");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
