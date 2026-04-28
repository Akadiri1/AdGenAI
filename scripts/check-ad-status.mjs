import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Get the most recent ad with its scenes
const ad = await prisma.ad.findFirst({
  where: { finalVideoStatus: { not: null } },
  orderBy: { updatedAt: "desc" },
  include: { scenes: { orderBy: { sceneNumber: "asc" } } },
});

if (!ad) {
  console.log("No ads with finalVideoStatus found");
} else {
  console.log("Ad:", ad.id);
  console.log("finalVideoStatus:", ad.finalVideoStatus);
  console.log("videoUrl:", ad.videoUrl ? "set" : "null");
  console.log("\nScenes:");
  for (const s of ad.scenes) {
    console.log(`  Scene ${s.sceneNumber}: status=${s.status} | videoClipUrl=${s.videoClipUrl ? "✅" : "❌"} | lipSyncTaskId=${s.lipSyncTaskId ?? "none"} | finalClipUrl=${s.finalClipUrl ? "✅" : "❌"}`);
  }
}
await prisma.$disconnect();
