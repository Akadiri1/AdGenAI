import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, getRequestContext } from "@/lib/audit";
import { z } from "zod";

const bodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Only delete ads owned by this user
  const result = await prisma.ad.deleteMany({
    where: {
      id: { in: body.ids },
      userId: session.user.id,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "ad_deleted",
    metadata: { kind: "bulk_delete", count: result.count, ids: body.ids },
    ...getRequestContext(req),
  });

  return NextResponse.json({ success: true, deleted: result.count });
}
