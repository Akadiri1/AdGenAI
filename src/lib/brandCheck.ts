import { isStorageConfigured } from "./storage";
import { prisma } from "./prisma";

/**
 * Checks if a user has completed their brand kit/business profile.
 */
export async function checkBrandKit(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      businessName: true,
      businessDescription: true,
      businessIndustry: true,
      targetAudience: true,
      brandVoice: true,
      brandColors: true,
    },
  });

  if (!user) return { complete: false, missing: ["User not found"], percentage: 0 };

  const fields = [
    { key: "businessName", label: "Business Name" },
    { key: "businessDescription", label: "Business Description" },
    { key: "businessIndustry", label: "Industry" },
    { key: "targetAudience", label: "Target Audience" },
    { key: "brandVoice", label: "Brand Voice" },
    { key: "brandColors", label: "Brand Colors" },
  ];

  const missing = fields
    .filter((f) => !user[f.key as keyof typeof user])
    .map((f) => f.label);

  const completeCount = fields.length - missing.length;
  const percentage = Math.round((completeCount / fields.length) * 100);

  return {
    complete: missing.length === 0,
    missing,
    percentage,
  };
}

/**
 * Checks if a URL is likely unreachable by external AI providers (Replicate, Kling, Qwen).
 * Returns true if the URL is problematic (localhost, 127.0.0.1, or private IP).
 */
export function isUnreachableUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  
  // Localhost / Loopback
  if (u.includes("localhost") || u.includes("127.0.0.1")) return true;
  
  // Private IP ranges
  // 10.0.0.0 – 10.255.255.255
  // 172.16.0.0 – 172.31.255.255
  // 192.168.0.0 – 192.168.255.255
  if (u.includes("//10.") || u.includes("//192.168.") || u.includes("//172.")) {
    // Basic check for common private IP patterns
    return true;
  }

  return false;
}

/**
 * Validates that generation can proceed. 
 * Returns an error message if connectivity is broken, or null if okay.
 */
export function validateConnectivity(params: {
  actorImageUrl?: string | null;
  productImageUrls?: string[];
}): string | null {
  if (isStorageConfigured()) return null;

  if (isUnreachableUrl(params.actorImageUrl)) {
    return "Connectivity Error: Your actor image is on 'localhost'. External AI providers (Replicate/Kling) cannot reach it. Use ngrok to make your local server public.";
  }

  for (const url of params.productImageUrls ?? []) {
    if (isUnreachableUrl(url)) {
      return "Connectivity Error: One of your product images is on 'localhost'. External AI providers cannot reach it. Use ngrok.";
    }
  }

  return null;
}
