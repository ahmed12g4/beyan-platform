import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking attacks
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Prevent MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Enable XSS filter in older browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Control referrer information
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Force HTTPS for 1 year
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Restrict browser features
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // Content Security Policy — prevents XSS attacks
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + Google Analytics + Meta Pixel + inline scripts (Next.js requires unsafe-inline for hydration)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://cdnjs.cloudflare.com https://www.google.com https://www.gstatic.com",
      // Styles: self + Google Fonts + inline styles (Tailwind/Next.js requires unsafe-inline)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      // Fonts: self + Google Fonts
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      // Images: self + Supabase storage + ui-avatars CDN + data URIs + unsplash + youtube thumbnails
      "img-src 'self' data: blob: https://bxkolaimlyqnevcyslkc.supabase.co https://ui-avatars.com https://www.google-analytics.com https://www.facebook.com https://www.gstatic.com https://flagcdn.com https://images.unsplash.com https://youtu.be https://i.ytimg.com https://img.youtube.com",
      // Connections: self + Supabase + Analytics
      "connect-src 'self' https://bxkolaimlyqnevcyslkc.supabase.co wss://bxkolaimlyqnevcyslkc.supabase.co https://www.google-analytics.com https://analytics.google.com https://www.facebook.com",
      // Frames: allow youtube and vimeo
      "frame-src 'self' https://www.google.com https://www.youtube.com https://youtube.com https://player.vimeo.com",
      // Objects: block all
      "object-src 'none'",
      // Base URI: self only
      "base-uri 'self'",
      // Form actions: self only
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  // Compress responses for faster delivery
  compress: true,

  // Security headers on all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Prevent search engine indexing of private dashboard pages
      {
        source: '/(admin|student|teacher)(.*)',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  },

  images: {
    // Optimize image formats for performance
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        port: '',
        pathname: '/api/**',
      },
      {
        protocol: 'https',
        hostname: 'bxkolaimlyqnevcyslkc.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'youtu.be',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  serverExternalPackages: ['iyzipay'],
};

export default nextConfig;


