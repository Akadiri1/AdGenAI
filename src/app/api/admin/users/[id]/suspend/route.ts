import { NextResponse } from "next/server";
import { checkAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { logAudit, getRequestContext } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  await prisma.user.update({ where: { id }, data: { isSuspended: true } });
  await logAudit({
    userId: admin.id,
    action: "user_suspended",
    resource: id,
    metadata: { targetUserId: id },
    ...getRequestContext(req),
  });
  return NextResponse.json({ success: true });
}
