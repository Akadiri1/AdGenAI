import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generatePresignedUrl, isStorageConfigured } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "Storage is not configured on this server." }, { status: 503 });
  }

  try {
    const { filename, contentType, folder } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType are required" }, { status: 400 });
    }

    const { uploadUrl, publicUrl } = await generatePresignedUrl(filename, contentType, folder || "uploads");

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (err) {
    console.error("[presign-error]", err);
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}
