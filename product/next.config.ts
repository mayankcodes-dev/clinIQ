import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker edge deployment.
  // Only activate when NEXT_OUTPUT=standalone (set in Dockerfile ENV).
  // Do NOT enable by default — causes PageNotFoundError with workspace root
  // detection when a package-lock.json exists in a parent directory.
  ...(process.env.NEXT_OUTPUT === "standalone" ? { output: "standalone" } : {}),
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Fix: multiple package-lock.json files confuse Next.js workspace root detection
  outputFileTracingRoot: require("path").join(__dirname, "./"),
  images: {
    remotePatterns: [],
  },
  // crypto kept server-side for ABDM HMAC signing
  serverExternalPackages: ["crypto"],
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=self, microphone=self, geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
