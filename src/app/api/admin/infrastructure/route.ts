import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isQwenConfigured } from "@/lib/qwen";
import { isReplicateConfigured } from "@/lib/replicate";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true }
  });

  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch tracked providers from DB
  const providers = await prisma.apiProvider.findMany({
    orderBy: { priority: "asc" }
  });

  // Perform LIVE checks for configured providers
  const liveResults = await Promise.all(providers.map(async (p) => {
    let isLive = false;
    let liveError = null;

    try {
      if (p.name === "qwen" && isQwenConfigured()) {
        const res = await fetch("https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models", {
          headers: { Authorization: `Bearer ${process.env.QWEN_API_KEY}` }
        });
        isLive = res.ok;
        if (!res.ok) liveError = `API Error ${res.status}`;
      }

      if (p.name === "replicate" && isReplicateConfigured()) {
        const res = await fetch("https://api.replicate.com/v1/account", {
          headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` }
        });
        isLive = res.ok;
        if (!res.ok) liveError = `API Error ${res.status}`;
      }
    } catch (err) {
      liveError = (err as Error).message;
    }

    return {
      ...p,
      status: isLive ? "online" : (liveError ? "offline" : p.status),
      lastError: liveError || p.lastError,
      isLiveVerified: isLive
    };
  }));

  return NextResponse.json(liveResults);
}
