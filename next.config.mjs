import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(new URL('.', import.meta.url).pathname);
    return config;
  },
};

export default nextConfig;
