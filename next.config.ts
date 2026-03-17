import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/s/IVM_Newsletter_2025_September.pdf",
        destination: "/newsletters",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
