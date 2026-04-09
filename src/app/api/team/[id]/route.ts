import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Update team name
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const team = await prisma.team.findUnique({ where: { id } });
  if (!team || team.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Not the team owner" }, { status: 403 });
  }

  const { name } = z.object({ name: z.string().min(1).max(50) }).parse(await req.json());

  await prisma.team.update({ where: { id }, data: { name } });
  return NextResponse.json({ success: true });
}

// Delete team
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const team = await prisma.team.findUnique({ where: { id } });
  if (!team || team.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Not the team owner" }, { status: 403 });
  }

  // Delete all members first, then the team
  await prisma.teamMember.deleteMany({ where: { teamId: id } });
  await prisma.team.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
