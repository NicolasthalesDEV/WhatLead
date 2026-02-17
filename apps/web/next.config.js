/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['*'] }
  },

  // Transpile workspace packages for Vercel
  transpilePackages: ['@wacrm/db'],

  // Optimize for Vercel deployment
  output: 'standalone',

  // Webpack configuration for Prisma and path resolution
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client');
    }

    // Ensure @ alias works correctly
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    return config;
  },

  // Environment variables that should be available at build time
  env: {
    SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION,
  },

  // Image optimization domains (add your domains here)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
