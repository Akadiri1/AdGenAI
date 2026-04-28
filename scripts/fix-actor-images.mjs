/**
 * Updates all user-owned Actor rows to use the correct FLUX portrait URLs.
 * Run: node scripts/fix-actor-images.mjs
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const APP_URL = (process.env.NEXTAUTH_URL ?? "https://famousli.vercel.app").replace(/\/$/, "");

// Map avatar name → correct absolute URL
const PORTRAIT_MAP = {
  "Sofia":  `${APP_URL}/actors/ava-001.png`,
  "Emma":   `${APP_URL}/actors/ava-003.png`,
};

let fixed = 0;
for (const [name, url] of Object.entries(PORTRAIT_MAP)) {
  const result = await prisma.actor.updateMany({
    where: { name, imageUrl: { not: url } },
    data: { imageUrl: url, thumbnailUrl: url },
  });
  if (result.count > 0) {
    console.log(`✅ Updated ${result.count} "${name}" actor row(s) → ${url}`);
    fixed += result.count;
  }
}

if (fixed === 0) console.log("All actor images already up to date.");
else console.log(`\nFixed ${fixed} actor row(s).`);
await prisma.$disconnect();
