import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "bullmq",
    "ioredis",
    "nodemailer",
    "@ffmpeg/ffmpeg",
    "@ffmpeg/util",
    "@ffmpeg/core",
  ],
};

export default nextConfig;
