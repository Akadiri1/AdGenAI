import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enqueuePostAd } from "@/lib/queue";
import { z } from "zod";

const bodySchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  postNow: z.boolean().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = bodySchema.parse(await req.json());
  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad || ad.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const scheduledAt = body.postNow
    ? new Date()
    : body.scheduledAt
      ? new Date(body.scheduledAt)
      : null;

  await prisma.ad.update({
    where: { id },
    data: { scheduledAt, status: "SCHEDULED" },
  });

  try {
    await enqueuePostAd({ adId: id, userId: session.user.id }, scheduledAt ?? undefined);
  } catch (err) {
    return NextResponse.json(
      { error: "Queue unavailable. Start Redis + the worker.", details: (err as Error).message },
      { status: 503 },
    );
  }

  return NextResponse.json({ success: true, scheduledAt });
}
