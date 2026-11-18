import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  let hmrDisabled = process.env.DISABLE_HMR === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'disable-vite-client-ws-when-hmr-off',
        apply: 'serve',
        enforce: 'post',
        configResolved(config) {
          hmrDisabled =
            config.server.hmr === false ||
            config.server.ws === false ||
            process.env.DISABLE_HMR === 'true';
        },
        transform(code, id) {
          if (!hmrDisabled) return null;
          if (
            id.includes('vite/dist/client/client.mjs') ||
            code.includes('const createWebSocketModuleRunnerTransport')
          ) {
            const patched = code
              .replace(
                /const createWebSocketModuleRunnerTransport\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\n\};\n/,
                'const createWebSocketModuleRunnerTransport = () => ({ async connect() {}, async disconnect() {}, send() {} });\n'
              )
              .replace(
                'setupForwardConsoleHandler(transport, forwardConsole)',
                'void 0 /* console forwarding disabled because HMR is off */'
              );
            if (patched !== code) {
              return { code: patched, map: null };
            }
          }
          return null;
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
        manifest: {
          id: '/',
          name: 'IEB Horta — Igreja & Bíblia',
          short_name: 'IEB Horta',
          description: 'Bíblia digital multi-versões em português, planos de leitura, devocionais e comunidade da IEB Horta.',
          theme_color: '#13294B',
          background_color: '#FAF8F4',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          lang: 'pt-PT',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,woff,woff2}'],
          globIgnores: ['**/assets/aistudio/**'],
          navigateFallbackDenylist: [/^\/api\//, /^\/bibles\//],
          runtimeCaching: [
            {
              urlPattern: /\/bibles\/.*\.json$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'iebhorta-bibles-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      ws: process.env.DISABLE_HMR === 'true' ? false : undefined,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
