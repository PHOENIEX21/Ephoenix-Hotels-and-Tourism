const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'n4m6aaqd';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com', pathname: `/${cloudName}/image/upload/**` }],
  },
};

export default nextConfig;
