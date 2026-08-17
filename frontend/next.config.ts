import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained .next/standalone server (only the deps this
  // app actually needs), so the Docker runtime image doesn't have to ship
  // the full node_modules tree.
  output: "standalone",
};

export default nextConfig;
