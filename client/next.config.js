/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Profile pictures and banner images are external URLs only (no uploads in V1),
    // so remote patterns are opened broadly here and can be tightened once
    // real-world domains are known.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

module.exports = nextConfig;
