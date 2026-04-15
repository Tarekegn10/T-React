/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow development access from devices on the local 192.168.1.x network.
  allowedDevOrigins: ['192.168.1.*'],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
