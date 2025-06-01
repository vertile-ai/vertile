/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Configure image domains if you're using next/image
  images: {
    domains: [],
    // Set maximum image dimensions
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Format options for image optimization
    formats: ['image/webp'],
  },
  // Configure redirects if needed
  async redirects() {
    return [];
  },
  // Configure rewrites if needed
  async rewrites() {
    return [
      {
        source: '/workflow',
        destination: '/',
      },
      {
        source: '/workflows',
        destination: '/',
      },
    ];
  },
  // Enable standalone output for Docker
  output: 'standalone',

  // Additional configurations:

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Configure environment variables that should be available to the browser
  env: {
    APP_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
  },

  // Configure the base path if your app is not hosted at the root
  // basePath: '/app',

  // Configure trailing slash behavior
  trailingSlash: false,

  // Configure compression
  compress: true,

  // Configure webpack if needed
  webpack: (config, { isServer }) => {
    // Example: Add a webpack plugin or modify the config

    // Handle problematic native dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      // Use pure JS implementations instead of native modules
      bufferutil: false,
      'utf-8-validate': false,
      'es5-ext': false,
    };

    return config;
  },

  // Configure headers for all pages
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Configure page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx'],
};

// Note: i18n configuration with App Router should be moved to app/[locale] directory structure
// and configured in middleware.ts instead of next.config.mjs

export default nextConfig;
