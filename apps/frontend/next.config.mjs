import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @param {string} url */
function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null; // relative URL or invalid — skip
  }
}

/** @param {string} url */
function protocolFromUrl(url) {
  try {
    return new URL(url).protocol.replace(':', '');
  } catch {
    return 'http';
  }
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_INTERNAL_URL;
const apiHostname = apiUrl ? hostnameFromUrl(apiUrl) : null;

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      ...(apiHostname
        ? [{ protocol: apiUrl ? protocolFromUrl(apiUrl) : 'http', hostname: apiHostname }]
        : []),
    ],
  },

  // Proxy /api/* → backend so SSR server-components can use relative paths if needed.
  // Also allows frontend container to act as an API gateway for same-origin browser calls.
  async rewrites() {
    const internalApi = process.env.API_INTERNAL_URL || 'http://localhost:3001/api';
    return [
      {
        source: '/api/:path*',
        destination: `${internalApi}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
