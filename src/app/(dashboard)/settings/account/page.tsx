import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AccountClient } from "./AccountClient";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-text-secondary">Please log in</p>
        <Link href="/auth/login" className="text-primary font-semibold">Log in</Link>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, email: true, phone: true, image: true,
      plan: true, credits: true, country: true, language: true, currency: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  return (
    <AccountClient
      initial={{
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        plan: user.plan,
        credits: user.credits,
        country: user.country ?? "",
        language: user.language,
        currency: user.currency,
        createdAt: user.createdAt.toISOString(),
      }}
    />
  );
}
