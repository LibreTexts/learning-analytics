/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn.libretexts.net',
                port: '',
                pathname: '/**',
              },
        ]
    },
    output: "standalone"
};

export default nextConfig;
