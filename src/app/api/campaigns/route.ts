import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  objective: z.enum(["awareness", "traffic", "conversions", "sales"]).optional(),
  budget: z.number().min(0).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = bodySchema.parse(await req.json());

  const campaign = await prisma.campaign.create({
    data: {
      userId: session.user.id,
      name: body.name,
      objective: body.objective,
      budget: body.budget,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      status: "draft",
    },
  });

  return NextResponse.json({ id: campaign.id });
}
