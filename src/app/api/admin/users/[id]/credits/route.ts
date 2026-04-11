import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { logAudit, getRequestContext } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({ credits: z.number().int() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  let body;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { credits: { increment: body.credits } },
    select: { credits: true },
  });

  await logAudit({
    userId: admin.id,
    action: "admin_action",
    resource: id,
    metadata: { kind: "credits", delta: body.credits, newBalance: user.credits },
    ...getRequestContext(req),
  });
  return NextResponse.json({ success: true, credits: user.credits });
}
