import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'graph.facebook.com' },
      { protocol: 'https', hostname: 'appleid.cdn-apple.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' }
    ],
  },
};

export default nextConfig;
