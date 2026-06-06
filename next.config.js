/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optional: comma-separated ngrok/dev origins, e.g. ALLOWED_DEV_ORIGINS=https://xxx.ngrok-free.dev
  ...(process.env.ALLOWED_DEV_ORIGINS
    ? { allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean) }
    : {}),
};

export default nextConfig;
