/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ffkvytgvdqipscackxyg.supabase.co",
      },
      {
        protocol: "https",
        hostname: "bhiomaipnpdsthzpkped.supabase.co",
      },
    ],
  },
}

export default nextConfig
