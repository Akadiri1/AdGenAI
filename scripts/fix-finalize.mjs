/**
 * Fixes a stuck finalization by:
 * 1. Setting finalClipUrl = videoClipUrl for any scenes missing it
 * 2. Marking the ad as READY
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const ad = await prisma.ad.findFirst({
  where: { finalVideoStatus: "GENERATING" },
  orderBy: { updatedAt: "desc" },
  include: { scenes: { orderBy: { sceneNumber: "asc" } } },
});

if (!ad) { console.log("No stuck ads found"); process.exit(0); }

console.log("Fixing ad:", ad.id);

let firstFinalClip = null;
for (const scene of ad.scenes) {
  if (!scene.finalClipUrl && scene.videoClipUrl) {
    await prisma.scene.update({
      where: { id: scene.id },
      data: { finalClipUrl: scene.videoClipUrl },
    });
    console.log(`  Scene ${scene.sceneNumber}: set finalClipUrl from videoClipUrl`);
  }
  if (!firstFinalClip) firstFinalClip = scene.finalClipUrl ?? scene.videoClipUrl;
}

await prisma.ad.update({
  where: { id: ad.id },
  data: { finalVideoStatus: "READY", videoUrl: firstFinalClip, status: "READY" },
});

console.log("✅ Ad marked READY. Refresh Studio page.");
await prisma.$disconnect();
