/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // reactCompiler: true,
  serverExternalPackages: ["pdf-parse"],
    experimental: {
    optimizeCss: false, // ← Disable lightningcss

  },
   webpack: (config, { isServer }) => {
    return config;
  },
};

export default nextConfig;
