import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, getRequestContext } from "@/lib/audit";
import { z } from "zod";

const bodySchema = z.object({
  ids: z.array(z.string().min(1)).optional(),
  deleteAll: z.boolean().optional(),
}).refine(data => data.ids || data.deleteAll, {
  message: "Either ids or deleteAll must be provided",
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

  const whereClause = body.deleteAll 
    ? { userId: session.user.id } 
    : { id: { in: body.ids }, userId: session.user.id };

  const result = await prisma.ad.deleteMany({
    where: whereClause,
  });

  await logAudit({
    userId: session.user.id,
    action: "ad_deleted",
    metadata: { kind: "bulk_delete", count: result.count, deleteAll: !!body.deleteAll },
    ...getRequestContext(req),
  });

  return NextResponse.json({ success: true, deleted: result.count });
}
