/** @type {import('next').NextConfig} */
import dotenv from "dotenv";
dotenv.config();

/**
 * Security headers (non-HSTS). Vercel adds Strict-Transport-Security on production HTTPS;
 * duplicating HSTS here can send two values — rely on the platform unless you self-host.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    const immutable = [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ];
    return [
      {
        source: "/_next/static/:path*",
        headers: immutable,
      },
      {
        source: "/fonts/:path*",
        headers: immutable,
      },
      {
        source: "/favicon/:path*",
        headers: immutable,
      },
      {
        source: "/mock/:path*",
        headers: immutable,
      },
      {
        source: "/bg/:path*",
        headers: immutable,
      },
      {
        source: "/icons/:path*",
        headers: immutable,
      },
      {
        source: "/:all*(svg|jpg|jpeg|png|gif|webp|ico|woff2|otf)",
        headers: immutable,
      },
      {
        source: "/.well-known/apple-app-site-association",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
          ...securityHeaders,
        ],
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      // Legacy: premium page renamed to pricing
      { source: "/premium", destination: "/pricing", permanent: true },
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
