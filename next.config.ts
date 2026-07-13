import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Origin = Supabase Storage (public `media` bucket). next/image (Vercel)
    // resizes + serves WebP at the exact display size, cached at the edge.
    // WebP only: AVIF encodes ~50% slower on the first (uncached) request and
    // its size win is marginal at grid-thumbnail dimensions.
    formats: ["image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uyfyuvugmiqkxqjuubug.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  async headers() {
    // Razorpay checkout injects a script + iframe; Supabase serves images and
    // the REST/auth API. 'unsafe-inline' is required for Next's inline styles
    // and the JSON-LD/bootstrap scripts. Tighten further if you adopt nonces.
    // 'unsafe-eval' is dev-only: React uses eval() to reconstruct server
    // error stacks in the browser during development (not used in prod).
    const isDev = process.env.NODE_ENV === "development";
    const csp = [
      "default-src 'self'",
      "img-src 'self' data: blob: https://uyfyuvugmiqkxqjuubug.supabase.co",
      `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "frame-src https://api.razorpay.com https://checkout.razorpay.com",
      "connect-src 'self' https://uyfyuvugmiqkxqjuubug.supabase.co https://*.razorpay.com https://lumberjack.razorpay.com",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
