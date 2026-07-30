/**
 * Static export for GitHub Pages. No backend, no runtime fetches. PRD §13.
 *
 * `basePath` must match the repository name. It is applied for production
 * builds only, so `pnpm dev` serves from `/` while `pnpm build` + `pnpm preview`
 * reproduce exactly what Pages will serve.
 */
const REPOSITORY_NAME = 'lontara'

const isProduction = process.env.NODE_ENV === 'production'
const basePath = isProduction ? `/${REPOSITORY_NAME}` : ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
}

module.exports = nextConfig
