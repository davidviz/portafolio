/** @type {import('next').NextConfig} */
const nextConfig = {
  // Incluir los archivos de /dashboards (html + meta.json) en el bundle del
  // servidor en Vercel, para detectarlos y servirlos en runtime.
  experimental: {
    outputFileTracingIncludes: {
      "/api/dashboard/[slug]": ["./dashboards/**/*"],
      "/api/auth": ["./dashboards/**/*"],
    },
  },
};

module.exports = nextConfig;
