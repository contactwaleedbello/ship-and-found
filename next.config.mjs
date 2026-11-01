/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth?mode=login',
        permanent: false,
      },
      {
        source: '/register',
        destination: '/auth?mode=signup',
        permanent: false,
      },
      {
        source: '/signup',
        destination: '/auth?mode=signup',
        permanent: false,
      },
      {
        source: '/forgot-password',
        destination: '/auth?mode=reset',
        permanent: false,
      },
      {
        source: '/reset-password',
        destination: '/auth?mode=reset',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

