import { prisma } from "@/lib/prisma";
import { stringToPlatforms } from "@/lib/adHelpers";

/**
 * Builds a personalized AI context string from the user's:
 * - Brand kit (colors, logo, business type)
 * - Past ad history (what worked — highest scoring ads)
 * - Preferences (music genre, preferred platforms, language)
 *
 * This gets injected into Claude's system prompt so every generated ad
 * reflects the user's brand and what's worked before.
 */
export async function buildUserContext(userId: string): Promise<string> {
  const [user, topAds] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        businessName: true,
        businessType: true,
        businessUrl: true,
        businessDescription: true,
        businessIndustry: true,
        targetAudience: true,
        brandTagline: true,
        brandVoice: true,
        brandColors: true,
        brandLogo: true,
        language: true,
        country: true,
        currency: true,
      },
    }),
    // Fetch the user's top 5 performing ads by score
    prisma.ad.findMany({
      where: { userId, score: { not: null } },
      orderBy: { score: "desc" },
      take: 5,
      select: {
        headline: true,
        bodyText: true,
        callToAction: true,
        scriptFramework: true,
        musicGenre: true,
        platform: true,
        score: true,
        type: true,
      },
    }),
  ]);

  if (!user) return "";

  const parts: string[] = [];

  // Brand context — the more filled in, the better the AI output
  if (user.businessName) parts.push(`Business name: ${user.businessName}`);
  if (user.businessIndustry) parts.push(`Industry: ${user.businessIndustry}`);
  if (user.businessType) parts.push(`Business type: ${user.businessType}`);
  if (user.businessUrl) parts.push(`Website: ${user.businessUrl}`);
  if (user.businessDescription) parts.push(`What they do: ${user.businessDescription}`);
  if (user.targetAudience) parts.push(`Target audience: ${user.targetAudience}`);
  if (user.brandTagline) parts.push(`Tagline/slogan: "${user.brandTagline}"`);
  if (user.brandVoice) parts.push(`Brand voice/tone: ${user.brandVoice} — match this tone in all copy`);
  if (user.brandLogo) parts.push(`Has a logo (use it in image prompts if relevant)`);
  if (user.brandColors) {
    try {
      const colors = JSON.parse(user.brandColors);
      parts.push(`Brand colors: primary ${colors.primary ?? ""}, secondary ${colors.secondary ?? ""}, accent ${colors.accent ?? ""} — reference these in image prompts and suggest matching visuals`);
    } catch { /* ignore */ }
  }
  if (user.language && user.language !== "en") {
    parts.push(`Preferred language: ${user.language}`);
  }
  if (user.country) parts.push(`Country: ${user.country}`);

  // Learning from past ads
  if (topAds.length > 0) {
    parts.push("");
    parts.push("--- User's top-performing ads (learn from these patterns) ---");

    const preferredFrameworks = new Map<string, number>();
    const preferredGenres = new Map<string, number>();
    const preferredPlatforms = new Map<string, number>();

    for (const ad of topAds) {
      if (ad.scriptFramework) {
        preferredFrameworks.set(ad.scriptFramework, (preferredFrameworks.get(ad.scriptFramework) ?? 0) + 1);
      }
      if (ad.musicGenre) {
        preferredGenres.set(ad.musicGenre, (preferredGenres.get(ad.musicGenre) ?? 0) + 1);
      }
      for (const p of stringToPlatforms(ad.platform)) {
        preferredPlatforms.set(p, (preferredPlatforms.get(p) ?? 0) + 1);
      }

      parts.push(`  - Score ${ad.score}/100: "${ad.headline}" | "${ad.bodyText}" | CTA: "${ad.callToAction}" | Framework: ${ad.scriptFramework ?? "none"}`);
    }

    // Summarize patterns
    const topFramework = [...preferredFrameworks.entries()].sort(([, a], [, b]) => b - a)[0];
    const topGenre = [...preferredGenres.entries()].sort(([, a], [, b]) => b - a)[0];
    const topPlatform = [...preferredPlatforms.entries()].sort(([, a], [, b]) => b - a)[0];

    parts.push("");
    parts.push("Patterns observed:");
    if (topFramework) parts.push(`  - Preferred framework: ${topFramework[0]}`);
    if (topGenre) parts.push(`  - Preferred music: ${topGenre[0]}`);
    if (topPlatform) parts.push(`  - Most active platform: ${topPlatform[0]}`);
  }

  return parts.join("\n");
}
