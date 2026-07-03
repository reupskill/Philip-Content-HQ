import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The generate route reads the knowledge base from disk at runtime;
  // make sure those markdown files are bundled into the serverless function.
  outputFileTracingIncludes: {
    "/api/generate": [
      "./knowledge-base/**/*",
      "./templates/**/*",
      "./hooks-bank.md",
    ],
  },
};

export default nextConfig;
