/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['three'],
  experimental: {
    // The world bundle is huge and must never be pulled into the Codex's graph.
    optimizePackageImports: ['@react-three/drei'],
  },
  webpack: (config) => {
    // Shaders are text, and they import the generated GLSL token constants.
    config.module.rules.push({ test: /\.(glsl|vert|frag)$/, type: 'asset/source' });
    return config;
  },
};

export default nextConfig;
