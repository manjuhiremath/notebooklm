/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // reactCompiler: true,
  serverExternalPackages: ["pdf-parse"],
    experimental: {
    optimizeCss: false, // ← Disable lightningcss
  },
};

export default nextConfig;
