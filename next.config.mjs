/** @type {import('next').NextConfig} */
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig = {
  reactStrictMode: false, // Disabling strict mode in dev to potentially speed up loading and reduce double-renders
};

export default withNextIntl(nextConfig);
