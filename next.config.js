/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  env: {
    // Production: api.easysteperp.com və ya Railway direct (2qz1te51.up.railway.app) işləyir
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.RAILWAY_PUBLIC_URL ||
      (process.env.NODE_ENV === "production" ? "https://2qz1te51.up.railway.app" : undefined),
  },
};

module.exports = nextConfig;
