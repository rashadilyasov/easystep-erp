/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.VERCEL ? "../.next" : ".next",
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "production" ? "https://api.easysteperp.com" : undefined),
  },
};

module.exports = nextConfig;
