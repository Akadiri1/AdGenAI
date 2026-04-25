// Promote banjimayowa@gmail.com to admin (so payment + signup notifications fire to that inbox).
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const email = "banjimayowa@gmail.com";

const me = await prisma.user.findUnique({
  where: { email },
  select: { id: true, email: true, isAdmin: true },
});
console.log("Before:", me);
if (!me) {
  console.error(`No user with email ${email}. Sign in once first.`);
  process.exit(1);
}
if (!me.isAdmin) {
  await prisma.user.update({ where: { id: me.id }, data: { isAdmin: true } });
  console.log(`✅ ${email} is now admin`);
} else {
  console.log("Already admin.");
}
await prisma.$disconnect();
