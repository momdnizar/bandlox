import type { NextConfig } from "next";

function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'NEXT_PUBLIC_RAZORPAY_KEY_ID',
    'RESEND_API_KEY',
    'FROM_EMAIL',
  ] as const

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.warn(
      `⚠️ Missing required environment variables:\n  ${missing.join(', ')}\n` +
        'The application may not function correctly.'
    )
  }
}

validateEnv()

const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default config;