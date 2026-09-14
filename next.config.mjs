/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['better-sqlite3', 'xlsx'],
  eslint: { ignoreDuringBuilds: true },
  experimental: { serverActions: { bodySizeLimit: '25mb' } },
};
export default nextConfig;
