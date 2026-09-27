import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  turbopack: {
    // Avoid picking a parent lockfile as the workspace root
    root: process.cwd(),
  },
};

export default withSerwist(nextConfig);
