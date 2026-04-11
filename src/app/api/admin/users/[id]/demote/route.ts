import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { logAudit, getRequestContext } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  if (id === admin.id) {
    return NextResponse.json({ error: "Cannot demote yourself" }, { status: 400 });
  }

  await prisma.user.update({ where: { id }, data: { isAdmin: false } });
  await logAudit({
    userId: admin.id,
    action: "admin_action",
    resource: id,
    metadata: { kind: "demote", targetUserId: id },
    ...getRequestContext(req),
  });
  return NextResponse.json({ success: true });
}
