import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/sign-in",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
