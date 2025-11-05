/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // reactCompiler: true,
  serverExternalPackages: ["pdf-parse"],
    experimental: {
    optimizeCss: false, // ← Disable lightningcss
  },
  webpack: (config, { isServer }) => {
    // Prevent lightningcss from loading
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'lightningcss': false,
    };
    return config;
  },
};

export default nextConfig;
