import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, getRequestContext } from "@/lib/audit";
import { z } from "zod";

const optionalUrl = z.union([z.string().url(), z.literal(""), z.null(), z.undefined()]);
const optionalStr = z.union([z.string(), z.literal(""), z.null(), z.undefined()]);

const bodySchema = z.object({
  businessName: optionalStr,
  businessType: optionalStr,
  businessUrl: optionalUrl,
  businessDescription: optionalStr,
  businessIndustry: optionalStr,
  targetAudience: optionalStr,
  brandTagline: optionalStr,
  brandVoice: optionalStr,
  brandColors: z.any().optional(),
  brandLogo: optionalUrl,
  language: optionalStr,
  country: optionalStr,
  currency: optionalStr,
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid data", details: (err as Error).message },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      businessName: body.businessName || null,
      businessType: body.businessType || null,
      businessUrl: body.businessUrl || null,
      businessDescription: body.businessDescription || null,
      businessIndustry: body.businessIndustry || null,
      targetAudience: body.targetAudience || null,
      brandTagline: body.brandTagline || null,
      brandVoice: body.brandVoice || null,
      brandColors: body.brandColors ? JSON.stringify(body.brandColors) : null,
      brandLogo: body.brandLogo || null,
      language: body.language || undefined,
      country: body.country || undefined,
      currency: body.currency || undefined,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "brand_kit_updated",
    metadata: { businessName: body.businessName || undefined },
    ...getRequestContext(req),
  });

  return NextResponse.json({ success: true });
}
