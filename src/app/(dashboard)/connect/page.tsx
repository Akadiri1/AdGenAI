import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConnectClient } from "./ConnectClient";

export const dynamic = "force-dynamic";

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

  const accounts = session?.user?.id
    ? await prisma.socialAccount.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <ConnectClient
      accounts={JSON.parse(JSON.stringify(accounts))}
      success={params.success ?? null}
      error={params.error ?? null}
    />
  );
}
