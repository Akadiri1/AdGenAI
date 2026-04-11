import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { logAudit, getRequestContext } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["FREE", "STARTER", "PRO", "BUSINESS", "ENTERPRISE"]),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  let body;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const prev = await prisma.user.findUnique({ where: { id }, select: { plan: true } });
  await prisma.user.update({ where: { id }, data: { plan: body.plan } });

  await logAudit({
    userId: admin.id,
    action: "plan_upgraded",
    resource: id,
    metadata: { kind: "admin_plan_change", from: prev?.plan, to: body.plan, targetUserId: id },
    ...getRequestContext(req),
  });
  return NextResponse.json({ success: true });
}
