import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Create a team
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
  if (!user || !["BUSINESS", "ENTERPRISE"].includes(user.plan)) {
    return NextResponse.json({ error: "Team collaboration requires Business or Enterprise plan" }, { status: 402 });
  }

  const { name } = z.object({ name: z.string().min(1).max(50) }).parse(await req.json());

  const existing = await prisma.team.findFirst({ where: { ownerId: session.user.id } });
  if (existing) return NextResponse.json({ error: "You already have a team" }, { status: 400 });

  const team = await prisma.team.create({
    data: {
      name,
      ownerId: session.user.id,
      members: { create: { userId: session.user.id, role: "owner" } },
    },
    include: { members: true },
  });

  return NextResponse.json({ team });
}

// Get my team
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
    include: {
      team: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          },
          owner: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!membership) return NextResponse.json({ team: null });
  return NextResponse.json({ team: membership.team, myRole: membership.role });
}
