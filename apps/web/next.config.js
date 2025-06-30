/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental: {
  //   appDir: true, // Removed - no longer needed in Next.js 14+
  // },
  transpilePackages: ['@dailysync/config'],
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  images: {
    domains: ['localhost'],
  },
  // Vercel-specific optimizations
  poweredByHeader: false,
  compress: true,
  // Ensure proper TypeScript compilation
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily disable ESLint during Vercel builds
  },
};

module.exports = nextConfig;
