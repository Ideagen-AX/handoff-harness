/** @type {import('next').NextConfig} */
const nextConfig = {
  // The specs/ markdown files are read at runtime by the harness.
  // Ensure they're traced into the serverless function bundle on Vercel.
  outputFileTracingIncludes: {
    "/api/run": ["./specs/**/*"],
  },
};

module.exports = nextConfig;
