import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Remove a team member
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: memberId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myMembership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id, role: { in: ["owner", "admin"] } },
  });
  if (!myMembership) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const target = await prisma.teamMember.findUnique({ where: { id: memberId } });
  if (!target || target.teamId !== myMembership.teamId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  if (target.role === "owner") {
    return NextResponse.json({ error: "Cannot remove team owner" }, { status: 400 });
  }

  await prisma.teamMember.delete({ where: { id: memberId } });
  return NextResponse.json({ success: true });
}
