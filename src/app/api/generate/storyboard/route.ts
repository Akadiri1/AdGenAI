/**
 * Legacy storyboard endpoint — DISABLED.
 * The new ecommerce video pipeline is at /api/generate/ecommerce
 * which uses Kling for real video generation (no more FFmpeg slideshows).
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "This endpoint has been retired. Use POST /api/generate/ecommerce for the new flow.",
      newEndpoint: "/api/generate/ecommerce",
    },
    { status: 410 }, // Gone
  );
}
