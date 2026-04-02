import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "@napi-rs/canvas", "canvas", "jszip", "googleapis"],
};

export default nextConfig;
