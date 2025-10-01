/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Replace these with your actual domains
          { key: "Content-Security-Policy", value: "frame-ancestors https://YOUR-SQUARESPACE-DOMAIN.squarespace.com https://YOUR-CUSTOM-DOMAIN.com;" }
        ]
      }
    ];
  }
};
export default nextConfig;