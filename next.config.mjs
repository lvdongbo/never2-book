import { loadLocalDataConfig } from "./drizzle/local-data.mjs";

loadLocalDataConfig();

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "better-sqlite3",
      "pg",
      "@neondatabase/serverless",
      "@vercel/blob",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
