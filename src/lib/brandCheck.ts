import { prisma } from "@/lib/prisma";

export type BrandCheckResult = {
  complete: boolean;
  missing: string[];
  percentage: number;
};

const REQUIRED_FIELDS = [
  { key: "businessName", label: "Business name" },
  { key: "businessIndustry", label: "Industry" },
  { key: "businessDescription", label: "Business description" },
  { key: "targetAudience", label: "Target audience" },
] as const;

const OPTIONAL_FIELDS = [
  { key: "businessType", label: "Business type" },
  { key: "brandTagline", label: "Tagline" },
  { key: "brandVoice", label: "Brand voice" },
  { key: "brandLogo", label: "Logo" },
] as const;

export async function checkBrandKit(userId: string): Promise<BrandCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      businessName: true,
      businessType: true,
      businessIndustry: true,
      businessDescription: true,
      targetAudience: true,
      brandTagline: true,
      brandVoice: true,
      brandLogo: true,
    },
  });

  if (!user) return { complete: false, missing: ["User not found"], percentage: 0 };

  const record = user as Record<string, string | null>;
  const missing: string[] = [];

  for (const f of REQUIRED_FIELDS) {
    if (!record[f.key]?.trim()) missing.push(f.label);
  }

  const allFields = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];
  const filled = allFields.filter((f) => !!record[f.key]?.trim()).length;
  const percentage = Math.round((filled / allFields.length) * 100);

  return {
    complete: missing.length === 0,
    missing,
    percentage,
  };
}
