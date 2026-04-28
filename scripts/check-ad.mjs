import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const adId = process.argv[2];
const ad = adId
  ? await prisma.ad.findUnique({ where: { id: adId }, include: { actor: true, scenes: { orderBy: { sceneNumber: "asc" } } } })
  : await prisma.ad.findFirst({ orderBy: { updatedAt: "desc" }, include: { actor: true, scenes: { orderBy: { sceneNumber: "asc" } } } });

if (!ad) { console.log("Ad not found"); process.exit(1); }

console.log("ID:", ad.id);
console.log("Status:", ad.status);
console.log("finalVideoStatus:", ad.finalVideoStatus);
console.log("actorId:", ad.actorId, "| actor:", ad.actor?.name ?? "NULL");
console.log("scenes:", ad.scenes.length);
for (const s of ad.scenes) {
  console.log(`  Scene ${s.sceneNumber}: ${s.status} | clip=${s.videoClipUrl ? "✅" : "❌"} | final=${s.finalClipUrl ? "✅" : "❌"} | lipsync=${s.lipSyncTaskId ?? "none"}`);
}
await prisma.$disconnect();
