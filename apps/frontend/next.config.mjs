import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      // Production API upload domain — update NEXT_PUBLIC_API_URL host when deploying
      ...(process.env.NEXT_PUBLIC_API_URL
        ? [{
            protocol: process.env.NEXT_PUBLIC_API_URL.startsWith('https') ? 'https' : 'http',
            hostname: new URL(process.env.NEXT_PUBLIC_API_URL).hostname,
          }]
        : []
      ),
    ],
  },
};

export default withNextIntl(nextConfig);
