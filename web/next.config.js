/** @type {import('next').NextConfig} */
const getApiUrl = () => {
  const url = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (url) return url.replace(/\/$/, "");
  if (process.env.VERCEL) return "https://a19hvpgi.up.railway.app";
  return "http://localhost:5000";
};

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${getApiUrl()}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
