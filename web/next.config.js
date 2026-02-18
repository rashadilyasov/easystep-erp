/** @type {import('next').NextConfig} */
const getApiUrl = () => {
  let url = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (url) {
    url = url.replace(/\/$/, "").trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    return url;
  }
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
