import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const ad = await prisma.ad.findFirst({
    orderBy: { updatedAt: "desc" },
    include: { 
      actor: true, 
      scenes: { orderBy: { sceneNumber: "asc" } } 
    }
  });

  if (!ad) {
    console.log("No ads found");
    return;
  }

  console.log("Ad ID:", ad.id);
  console.log("Ad Status:", ad.status);
  console.log("Actor Image URL:", ad.actor?.imageUrl);
  console.log("Product Images:", ad.productImages);

  for (const s of ad.scenes) {
    console.log(`\n--- Scene ${s.sceneNumber} ---`);
    console.log("Status:", s.status);
    console.log("Composite Image URL:", s.compositeImageUrl);
    console.log("Error:", s.editInstructions);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
