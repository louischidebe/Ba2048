import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Keep your existing alias
    config.resolve.alias["@"] = path.resolve(new URL(".", import.meta.url).pathname);

    // Add this fallback to silence the React Native async-storage error
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      "@react-native-async-storage/async-storage": false,
    };

    return config;
  },
};

export default nextConfig;
