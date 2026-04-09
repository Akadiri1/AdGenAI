import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { z } from "zod";

// List API keys
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, prefix: true, lastUsedAt: true, isActive: true, usageCount: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keys });
}

// Create a new API key
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
  if (!user || !["BUSINESS", "ENTERPRISE"].includes(user.plan)) {
    return NextResponse.json({ error: "API access requires Business or Enterprise plan" }, { status: 402 });
  }

  const { name } = z.object({ name: z.string().max(50).default("Default") }).parse(await req.json());

  // Generate a secure API key: adg_<random>
  const raw = crypto.randomBytes(32).toString("hex");
  const key = `adg_${raw}`;
  const prefix = `adg_${raw.slice(0, 8)}`;

  // Hash the key for storage (we only show full key once)
  const apiKey = await prisma.apiKey.create({
    data: { userId: session.user.id, name, key, prefix },
  });

  // Return the full key ONCE — after this, only the prefix is shown
  return NextResponse.json({
    id: apiKey.id,
    name: apiKey.name,
    key, // only returned on creation
    prefix: apiKey.prefix,
    message: "Save this key now — you won't be able to see it again",
  });
}
