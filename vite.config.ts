import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: false // ⚡️ Disable SW in dev to avoid "blank screen" issues with cache
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'], // Explicitly define what to cache
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        includeAssets: ['favicon.ico', 'apple-icon-180x180.png', 'manifest.json'],
        manifest: {
          name: 'bubbletz',
          short_name: 'bubbletz',
          description: 'Premium laundry service in dar es saam',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'android-icon-36x36.png',
              sizes: '36x36',
              type: 'image/png'
            },
            {
              src: 'android-icon-48x48.png',
              sizes: '48x48',
              type: 'image/png'
            },
            {
              src: 'android-icon-72x72.png',
              sizes: '72x72',
              type: 'image/png'
            },
            {
              src: 'android-icon-96x96.png',
              sizes: '96x96',
              type: 'image/png'
            },
            {
              src: 'android-icon-144x144.png',
              sizes: '144x144',
              type: 'image/png'
            },
            {
              src: 'android-icon-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
