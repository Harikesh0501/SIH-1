/** @type {import('next').NextConfig} */
const rawBackend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "https://sih-1-defq.onrender.com";
const BACKEND_URL = rawBackend.replace(/\/+$/, "");

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
