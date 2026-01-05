import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build  
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://automationwhats.stitchbyte.in/api/:path*',
      },
    ];
  },
  /* config options here */
};

export default nextConfig;
