// One-off: upgrade all existing users to PRO for dev testing.
// Run with: node scripts/upgrade-me.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const result = await prisma.user.updateMany({
  data: { plan: "PRO", credits: 100 },
});

console.log(`Upgraded ${result.count} user(s) to PRO with 100 credits.`);
await prisma.$disconnect();
