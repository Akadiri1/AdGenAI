import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Server-side admin check. Use in admin pages and APIs.
 * Redirects non-admins to dashboard.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isAdmin: true, email: true, name: true },
  });

  if (!user?.isAdmin) redirect("/dashboard");
  return user;
}

/**
 * For API routes — returns user or null instead of redirecting.
 */
export async function checkAdmin(): Promise<{ id: string; email: string | null } | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isAdmin: true, email: true },
  });

  if (!user?.isAdmin) return null;
  return { id: user.id, email: user.email };
}
