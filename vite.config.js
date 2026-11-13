// import { defineConfig } from 'vite'
// import vue from '@vitejs/plugin-vue'
// import { VitePWA } from 'vite-plugin-pwa'
// import { fileURLToPath, URL } from 'node:url'

// export default defineConfig({
//   plugins: [
//     vue(),
//     VitePWA({
//       registerType: 'autoUpdate',
//       includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
//       manifest: {
//         name: 'Inventory UMKM',
//         short_name: 'InventoryApp',
//         description: 'Aplikasi Inventory Management untuk UMKM',
//         theme_color: '#1e293b',
//         background_color: '#ffffff',
//         display: 'standalone',
//         orientation: 'portrait',
//         scope: '/',
//         start_url: '/',
//         icons: [
//           { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
//           { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
//         ]
//       },
//       workbox: {
//         globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
//         runtimeCaching: [
//           {
//             urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
//             handler: 'CacheFirst',
//             options: {
//               cacheName: 'google-fonts-cache',
//               expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
//               cacheableResponse: { statuses: [0, 200] }
//             }
//           },
//           {
//             urlPattern: /^https:\/\/rxpkkayblvayjeavrnsq\.supabase\.co\/.*/i,
//             handler: 'NetworkFirst',
//             options: {
//               cacheName: 'supabase-api-cache',
//               expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 },
//               cacheableResponse: { statuses: [0, 200] }
//             }
//           }
//         ],
//         navigateFallback: '/offline.html',
//         navigateFallbackDenylist: [/^\/api/]
//       },
//       devOptions: { enabled: true }
//     })
//   ],
//   resolve: {
//     alias: {
//       '@': fileURLToPath(new URL('./src', import.meta.url))
//     }
//   }
// })

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png'
      ],

      manifest: {
        name: 'Inventory UMKM',
        short_name: 'InventoryApp',
        description: 'Aplikasi Inventory Management untuk UMKM',

        theme_color: '#1e293b',
        background_color: '#ffffff',

        display: 'standalone',
        orientation: 'portrait',

        scope: '/',
        start_url: '/',

        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ],

        screenshots: [
          {
            src: '/screenshots/dashboard-mobile.png',
            sizes: '390x844',
            type: 'image/png',
            label: 'Dashboard Mobile'
          },
          {
            src: '/screenshots/dashboard-desktop.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Dashboard Desktop'
          }
        ]
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,

            handler: 'CacheFirst',

            options: {
              cacheName: 'google-fonts-cache',

              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },

              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },

          {
            urlPattern: /^https:\/\/rxpkkayblvayjeavrnsq\.supabase\.co\/.*/i,

            handler: 'NetworkFirst',

            options: {
              cacheName: 'supabase-api-cache',

              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5
              },

              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },

      devOptions: {
        enabled: true
      }
    })
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
