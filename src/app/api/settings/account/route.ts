import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().max(100).optional(),
  businessName: z.string().max(100).optional(),
  language: z.string().max(10).optional(),
  country: z.string().max(3).optional(),
  currency: z.string().max(5).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = bodySchema.parse(await req.json());

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: body.name ?? undefined,
      businessName: body.businessName ?? undefined,
      language: body.language ?? undefined,
      country: body.country ?? undefined,
      currency: body.currency ?? undefined,
    },
    select: { id: true, name: true, email: true, language: true, country: true, currency: true, plan: true, credits: true },
  });

  return NextResponse.json({ success: true, user: updated });
}
