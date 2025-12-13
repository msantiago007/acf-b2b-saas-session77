/** @type {import('next').NextConfig} */
const nextConfig = {
  // ML-Generated B2B SaaS Configuration (Session 76)
  reactStrictMode: true,

  // Suppress hydration warnings for development
  typescript: {
    // Build will fail on type errors (production-ready)
    ignoreBuildErrors: false,
  },

  eslint: {
    // Build will warn on lint errors but not fail
    ignoreDuringBuilds: false,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'B2B SaaS Generated App',
  },
}

module.exports = nextConfig
