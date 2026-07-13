/** @type {import('next').NextConfig} */
const nextConfig = {
  // The specs/ markdown files are read at runtime by the harness.
  // Ensure they're traced into the serverless function bundle on Vercel.
  outputFileTracingIncludes: {
    "/api/run": ["./specs/**/*"],
    "/api/deck": ["./specs/templates/**/*"],
  },
  // puppeteer-core is used only for local screenshot capture; keep it out of the
  // bundle so builds (and Vercel, where capture is skipped) don't choke on it.
  serverExternalPackages: ["puppeteer-core"],
};

module.exports = nextConfig;
