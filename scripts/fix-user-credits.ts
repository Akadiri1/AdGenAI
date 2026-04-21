import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { credits: 592 },
    select: { id: true, email: true, credits: true, plan: true }
  });

  console.log("Users with 592 credits:", JSON.stringify(users, null, 2));

  if (users.length > 0) {
    for (const user of users) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { credits: 20 }
      });
      console.log(`Updated user ${user.email ?? user.id} to ${updated.credits} credits.`);
    }
  } else {
    console.log("No users found with exactly 592 credits.");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
