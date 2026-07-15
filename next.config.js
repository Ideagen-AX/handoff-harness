/** @type {import('next').NextConfig} */
const nextConfig = {
  // The specs/ markdown + brand assets are read at runtime; trace them into the
  // serverless function bundles. Browser routes also need the serverless Chromium
  // binary (@sparticuz/chromium) traced in so capture/PDF work on Vercel.
  outputFileTracingIncludes: {
    "/api/run": ["./specs/**/*", "./node_modules/@sparticuz/chromium/**/*"],
    "/api/export": ["./node_modules/@sparticuz/chromium/**/*"],
    "/api/slide-pdf": ["./specs/templates/**/*", "./node_modules/@sparticuz/chromium/**/*"],
    "/api/deck": ["./specs/templates/**/*"],
    "/api/bundle": ["./specs/templates/**/*"],
    "/api/email": ["./specs/templates/**/*"],
  },
  // Keep the browser packages out of the webpack bundle — they're loaded at
  // runtime (puppeteer-core drives the browser; @sparticuz/chromium provides the
  // serverless Chromium binary).
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
};

module.exports = nextConfig;
