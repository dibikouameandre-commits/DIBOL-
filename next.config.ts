import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    // Disable the client Router Cache for dynamically-rendered pages so
    // admin pages (product/category lists and forms) never show stale
    // data after a mutation made from another page/tab.
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
