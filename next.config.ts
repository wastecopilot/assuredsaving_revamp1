import type { NextConfig } from "next";

/**
 * Security headers (from the security review):
 * - frame-ancestors / X-Frame-Options stop the consent form being framed (clickjacking).
 * - The CSP allows only this site's own scripts, styles and fonts (next/font self-hosts
 *   Public Sans). 'unsafe-inline' is needed for Next's inline bootstrap scripts and the
 *   token <style>; no user input ever reaches an HTML sink. Dev also needs 'unsafe-eval'.
 * - On Vercel preview deploys the vercel.live toolbar is blocked by this policy; that is expected.
 */
const prod = process.env.NODE_ENV === "production";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${prod ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${prod ? "" : " ws:"}`,
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "object-src 'none'",
  ...(prod ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
