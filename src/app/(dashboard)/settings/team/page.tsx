import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TeamClient } from "./TeamClient";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <div className="p-8 text-center"><Link href="/auth/login" className="text-primary">Log in</Link></div>;
  }

  const [user, membership] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
    prisma.teamMember.findFirst({
      where: { userId: session.user.id },
      include: {
        team: {
          include: {
            members: {
              include: { user: { select: { id: true, name: true, email: true } } },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    }),
  ]);

  const canManageTeam = ["BUSINESS", "ENTERPRISE"].includes(user?.plan ?? "FREE");
  const maxSeats = user?.plan === "ENTERPRISE" ? 999 : user?.plan === "BUSINESS" ? 10 : 0;

  return (
    <TeamClient
      team={membership?.team ? JSON.parse(JSON.stringify(membership.team)) : null}
      myRole={membership?.role ?? null}
      canManageTeam={canManageTeam}
      maxSeats={maxSeats}
      userId={session.user.id}
    />
  );
}
