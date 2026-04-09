import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, teamInviteEmail } from "@/lib/email";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, role } = z.object({
    email: z.string().email(),
    role: z.enum(["admin", "member", "viewer"]).default("member"),
  }).parse(await req.json());

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id, role: { in: ["owner", "admin"] } },
    include: { team: { include: { members: true, owner: { select: { plan: true, name: true, email: true } } } } },
  });
  if (!membership) return NextResponse.json({ error: "Not a team admin" }, { status: 403 });

  const plan = membership.team.owner.plan;
  const maxSeats = plan === "ENTERPRISE" ? 999 : plan === "BUSINESS" ? 10 : 0;
  if (membership.team.members.length >= maxSeats) {
    return NextResponse.json({ error: `Seat limit reached (${maxSeats} max)` }, { status: 400 });
  }

  let invitedUser = await prisma.user.findUnique({ where: { email } });

  if (invitedUser) {
    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: membership.teamId, userId: invitedUser.id } },
    });
    if (existing) return NextResponse.json({ error: "Already a team member" }, { status: 400 });

    await prisma.teamMember.create({
      data: { teamId: membership.teamId, userId: invitedUser.id, role, inviteEmail: email, inviteStatus: "pending" },
    });
  } else {
    invitedUser = await prisma.user.create({ data: { email, credits: 0 } });
    await prisma.teamMember.create({
      data: { teamId: membership.teamId, userId: invitedUser.id, role, inviteEmail: email, inviteStatus: "pending" },
    });
  }

  // Send invite email
  const origin = new URL(req.url).origin;
  const inviteUrl = `${origin}/auth/signup?invite=${membership.teamId}&email=${encodeURIComponent(email)}`;
  const inviterName = membership.team.owner.name ?? membership.team.owner.email ?? "Your team admin";

  const { subject, html } = teamInviteEmail({
    teamName: membership.team.name,
    inviterName,
    role,
    inviteUrl,
  });

  const sent = await sendEmail({ to: email, subject, html });

  return NextResponse.json({
    success: true,
    email,
    role,
    emailSent: sent,
    message: sent ? `Invite sent to ${email}` : `Invite created. Share this link with them:`,
    inviteUrl: sent ? undefined : inviteUrl,
  });
}
