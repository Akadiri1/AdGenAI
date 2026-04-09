import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BrandKitClient } from "./BrandKitClient";

export const dynamic = "force-dynamic";

export default async function BrandKitPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-text-secondary">Please log in</p>
        <Link href="/auth/login" className="text-primary font-semibold">Log in</Link>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
  });

  let colors: { primary?: string; secondary?: string; accent?: string } = {};
  try {
    colors = user?.brandColors ? JSON.parse(user.brandColors) : {};
  } catch {
    colors = {};
  }

  return (
    <BrandKitClient
      initial={{
        businessName: user?.businessName ?? "",
        businessType: user?.businessType ?? "",
        businessUrl: user?.businessUrl ?? "",
        businessDescription: user?.businessDescription ?? "",
        businessIndustry: user?.businessIndustry ?? "",
        targetAudience: user?.targetAudience ?? "",
        brandTagline: user?.brandTagline ?? "",
        brandVoice: user?.brandVoice ?? "",
        brandLogo: user?.brandLogo ?? "",
        brandColors: {
          primary: colors.primary ?? "#FF6B35",
          secondary: colors.secondary ?? "#004E89",
          accent: colors.accent ?? "#2EC4B6",
        },
        language: user?.language ?? "en",
        country: user?.country ?? "",
        currency: user?.currency ?? "USD",
      }}
    />
  );
}
