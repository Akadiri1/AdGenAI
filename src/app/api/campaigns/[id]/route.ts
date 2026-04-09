import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  objective: z.enum(["awareness", "traffic", "conversions", "sales"]).optional(),
  budget: z.number().min(0).nullable().optional(),
  status: z.enum(["draft", "active", "paused", "completed"]).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign || campaign.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = patchSchema.parse(await req.json());

  const updated = await prisma.campaign.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      objective: body.objective ?? undefined,
      budget: body.budget !== undefined ? body.budget : undefined,
      status: body.status ?? undefined,
      startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : undefined,
      endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : undefined,
    },
  });

  return NextResponse.json({ success: true, campaign: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign || campaign.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Detach ads from the campaign (don't delete the ads themselves)
  await prisma.ad.updateMany({
    where: { campaignId: id },
    data: { campaignId: null },
  });

  await prisma.campaign.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
