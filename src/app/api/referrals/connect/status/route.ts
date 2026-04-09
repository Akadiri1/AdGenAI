import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncConnectStatus } from "@/lib/stripeConnect";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ payoutsEnabled: false, detailsSubmitted: false });
  }

  try {
    const status = await syncConnectStatus(session.user.id);
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json(
      { error: "Could not fetch status", details: (err as Error).message },
      { status: 500 },
    );
  }
}
