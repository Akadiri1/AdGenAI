import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "fluent-ffmpeg",
    "@ffmpeg-installer/ffmpeg",
    "bullmq",
    "ioredis",
    "nodemailer",
  ],
};

export default nextConfig;
