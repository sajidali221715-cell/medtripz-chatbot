import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.3",
    "localhost",
    "0.0.0.0",
  ],
};

export default nextConfig;