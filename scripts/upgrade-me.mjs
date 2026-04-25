// One-off: upgrade all existing users to PRO for dev testing.
// Run with: node scripts/upgrade-me.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const result = await prisma.user.updateMany({
  data: { plan: "PRO", credits: 500 },
});

console.log(`Upgraded ${result.count} user(s) to PRO with 500 credits.`);
console.log("(A 15s video costs ~24 credits, 30s ~45, 60s ~90.)");
await prisma.$disconnect();
