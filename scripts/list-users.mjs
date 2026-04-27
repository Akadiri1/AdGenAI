import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const users = await prisma.user.findMany({
  select: { id: true, email: true, plan: true, credits: true, isAdmin: true, createdAt: true },
  orderBy: { createdAt: "desc" },
  take: 10,
});
console.table(users);
await prisma.$disconnect();
