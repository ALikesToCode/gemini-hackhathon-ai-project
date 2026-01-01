import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    resolveAlias: {
      lightningcss: path.join(__dirname, "lib", "lightningcss-shim.cjs"),
    },
  },
};

export default nextConfig;
