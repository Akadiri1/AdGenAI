import { prisma } from "@/lib/prisma";
import { getPoster } from "@/lib/social";
import { stringToPlatforms, stringToImages } from "@/lib/adHelpers";
import type { Platform } from "@/lib/social/types";

export type PostAdJobData = {
  adId: string;
  userId: string;
};

/**
 * Posts an ad to all its target platforms using the user's connected social accounts.
 * Records success/failure per platform and updates ad status.
 */
export async function processPostAdJob(data: PostAdJobData): Promise<void> {
  const { adId, userId } = data;

  const ad = await prisma.ad.findUnique({ where: { id: adId } });
  if (!ad || ad.userId !== userId) throw new Error("Ad not found");

  const adPlatforms = stringToPlatforms(ad.platform) as Platform[];

  await prisma.ad.update({
    where: { id: adId },
    data: { status: "POSTING" },
  });

  const accounts = await prisma.socialAccount.findMany({
    where: { userId, isActive: true, platform: { in: adPlatforms } },
  });
  const accountsByPlatform = new Map<Platform, typeof accounts[number]>();
  for (const acc of accounts) accountsByPlatform.set(acc.platform as Platform, acc);

  const mediaUrl = ad.videoUrl ?? (stringToImages(ad.images)[0] ?? null);
  if (!mediaUrl) throw new Error("No media on ad");
  const mediaType = ad.videoUrl ? "video" : "image";

  const results: Array<{ platform: Platform; success: boolean; error?: string }> = [];

  for (const platform of adPlatforms) {
    const account = accountsByPlatform.get(platform);
    if (!account) {
      results.push({ platform, success: false, error: "No connected account" });
      continue;
    }
    const poster = getPoster(platform);
    if (!poster) {
      results.push({ platform, success: false, error: "Platform not yet supported" });
      continue;
    }

    try {
      const caption = [ad.headline, ad.bodyText, ad.callToAction].filter(Boolean).join("\n\n");
      await poster.post(account.accessToken, account.accountId, {
        caption,
        mediaUrl,
        mediaType,
      });
      results.push({ platform, success: true });
    } catch (err) {
      results.push({ platform, success: false, error: (err as Error).message });
    }
  }

  const anySuccess = results.some((r) => r.success);
  await prisma.ad.update({
    where: { id: adId },
    data: {
      status: anySuccess ? "POSTED" : "FAILED",
      postedAt: anySuccess ? new Date() : null,
    },
  });

  if (!anySuccess) {
    throw new Error(`All platform posts failed: ${JSON.stringify(results)}`);
  }
}
