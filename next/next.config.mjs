/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "theplacestudio.hu" },
      { protocol: "https", hostname: "www.theplacestudio.hu" },

      // ha maradt pár hardcodeolt régi domain (nálad VAN):
      { protocol: "https", hostname: "csontkovacsbence.hu" },
      { protocol: "https", hostname: "www.csontkovacsbence.hu" },
        // ✅ local Strapi (dev)
      { protocol: "http", hostname: "localhost", port: "1337", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "1337", pathname: "/uploads/**" },
      { protocol: "http", hostname: "localhost", port: "3000", pathname: "/uploads/**" },

    ],
  },
  pageExtensions: ["ts", "tsx"],
  async redirects() {
    let redirections = [];
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/redirections`);
      const result = await res.json();
      const redirectItems = (result?.data ?? []).map(({ source, destination }) => {
        return {
          source: `/:locale${source}`,
          destination: `/:locale${destination}`,
          permanent: false,
        };
      });

      redirections = redirections.concat(redirectItems);
      return redirections;
    } catch {
      return [];
    }
  },
};

export default nextConfig;
