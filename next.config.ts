import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "bullmq",
    "ioredis",
    "nodemailer",
  ],
};

export default nextConfig;
