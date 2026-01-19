/** @type {import('next').NextConfig} */
import dotenv from "dotenv";
dotenv.config();

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Redirect non-www to www
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "loa-lawofattraction.co",
          },
        ],
        destination: "https://www.loa-lawofattraction.co/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
